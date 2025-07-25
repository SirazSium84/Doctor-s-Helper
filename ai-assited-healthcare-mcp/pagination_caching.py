"""
Pagination and caching utilities for Healthcare MCP Server
"""

from functools import lru_cache, wraps
from typing import Dict, Any, List, Optional, Tuple
import hashlib
import json
from datetime import datetime, timedelta
from dataclasses import dataclass
import threading
from config import supabase
from models import PaginationRequest, PaginatedResponse
from logging_config import get_logger

logger = get_logger("pagination_caching")

# Thread-safe cache with TTL support
class TTLCache:
    """Time-to-live cache implementation"""
    
    def __init__(self, max_size: int = 1000, default_ttl: int = 300):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._cache = {}
        self._access_times = {}
        self._lock = threading.RLock()
    
    def _generate_key(self, *args, **kwargs) -> str:
        """Generate cache key from function arguments"""
        key_data = {
            'args': args,
            'kwargs': sorted(kwargs.items())
        }
        key_string = json.dumps(key_data, sort_keys=True, default=str)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[Any]:
        """Get item from cache if not expired"""
        with self._lock:
            if key not in self._cache:
                return None
            
            item, expiry_time = self._cache[key]
            
            if datetime.utcnow() > expiry_time:
                # Item expired, remove it
                del self._cache[key]
                if key in self._access_times:
                    del self._access_times[key]
                return None
            
            # Update access time
            self._access_times[key] = datetime.utcnow()
            return item
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set item in cache with TTL"""
        with self._lock:
            # Use default TTL if not specified
            if ttl is None:
                ttl = self.default_ttl
            
            expiry_time = datetime.utcnow() + timedelta(seconds=ttl)
            
            # Check if we need to evict items
            if len(self._cache) >= self.max_size:
                self._evict_oldest()
            
            self._cache[key] = (value, expiry_time)
            self._access_times[key] = datetime.utcnow()
    
    def _evict_oldest(self) -> None:
        """Evict oldest accessed item"""
        if not self._access_times:
            return
        
        oldest_key = min(self._access_times.keys(), key=lambda k: self._access_times[k])
        del self._cache[oldest_key]
        del self._access_times[oldest_key]
    
    def clear(self) -> None:
        """Clear all cached items"""
        with self._lock:
            self._cache.clear()
            self._access_times.clear()
    
    def size(self) -> int:
        """Get current cache size"""
        with self._lock:
            return len(self._cache)

# Global cache instance
cache = TTLCache(max_size=1000, default_ttl=300)  # 5 minute default TTL

def cached(ttl: int = 300):
    """Decorator to cache function results with TTL"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = cache._generate_key(func.__name__, *args, **kwargs)
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.debug(
                    "Cache hit",
                    function=func.__name__,
                    cache_key=cache_key[:16]  # First 16 chars for logging
                )
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            
            logger.debug(
                "Cache miss, result cached",
                function=func.__name__,
                cache_key=cache_key[:16],
                ttl=ttl
            )
            
            return result
        return wrapper
    return decorator

@dataclass
class PaginationInfo:
    """Pagination metadata"""
    page: int
    page_size: int
    total_count: Optional[int] = None
    has_more: bool = False
    offset: int = 0
    
    def __post_init__(self):
        self.offset = (self.page - 1) * self.page_size

def paginate_supabase_query(
    table_name: str,
    select_columns: str = "*",
    filters: Optional[Dict[str, Any]] = None,
    order_by: Optional[str] = None,
    pagination: Optional[PaginationRequest] = None
) -> Dict[str, Any]:
    """
    Execute paginated Supabase query with metadata
    
    Args:
        table_name: Name of the table to query
        select_columns: Columns to select
        filters: Dictionary of column filters (eq, gt, lt, etc.)
        order_by: Column to order by
        pagination: Pagination parameters
        
    Returns:
        Paginated response with data and metadata
    """
    if pagination is None:
        pagination = PaginationRequest()
    
    logger.info(
        "Executing paginated query",
        table=table_name,
        page=pagination.page,
        page_size=pagination.page_size,
        filters=filters
    )
    
    try:
        # Build query
        query = supabase.table(table_name).select(select_columns)
        
        # Apply filters
        if filters:
            for column, value in filters.items():
                if isinstance(value, dict):
                    # Handle complex filters like {'gt': 10}
                    for operator, filter_value in value.items():
                        if operator == 'eq':
                            query = query.eq(column, filter_value)
                        elif operator == 'gt':
                            query = query.gt(column, filter_value)
                        elif operator == 'lt':
                            query = query.lt(column, filter_value)
                        elif operator == 'gte':
                            query = query.gte(column, filter_value)
                        elif operator == 'lte':
                            query = query.lte(column, filter_value)
                        elif operator == 'like':
                            query = query.like(column, filter_value)
                        elif operator == 'ilike':
                            query = query.ilike(column, filter_value)
                else:
                    # Simple equality filter
                    query = query.eq(column, value)
        
        # Apply ordering
        if order_by:
            query = query.order(order_by)
        
        # Apply pagination
        start_range = pagination.offset
        end_range = pagination.offset + pagination.page_size - 1
        query = query.range(start_range, end_range)
        
        # Execute query
        result = query.execute()
        
        # Calculate pagination metadata
        data_count = len(result.data)
        has_more = data_count == pagination.page_size
        
        # For total count, we'd need a separate count query
        # This is expensive, so we'll estimate based on the current page
        total_count = None
        if pagination.page == 1 and data_count < pagination.page_size:
            total_count = data_count
        
        response = {
            "data": result.data,
            "pagination": {
                "page": pagination.page,
                "page_size": pagination.page_size,
                "total_count": total_count,
                "has_more": has_more,
                "returned_count": data_count
            }
        }
        
        logger.info(
            "Paginated query completed",
            table=table_name,
            returned_count=data_count,
            has_more=has_more
        )
        
        return response
        
    except Exception as e:
        logger.error(
            "Paginated query failed",
            table=table_name,
            error=str(e),
            exc_info=True
        )
        raise

def get_total_count(
    table_name: str,
    filters: Optional[Dict[str, Any]] = None
) -> int:
    """
    Get total count for a table with filters (cached)
    
    Args:
        table_name: Name of the table
        filters: Dictionary of column filters
        
    Returns:
        Total count of matching records
    """
    @cached(ttl=600)  # Cache count for 10 minutes
    def _get_count(table: str, filter_str: str) -> int:
        query = supabase.table(table).select("id", count="exact")
        
        # Apply filters (simplified for count query)
        if filters:
            for column, value in filters.items():
                if not isinstance(value, dict):
                    query = query.eq(column, value)
        
        result = query.execute()
        return result.count or 0
    
    # Convert filters to string for caching
    filter_str = json.dumps(filters, sort_keys=True) if filters else ""
    
    return _get_count(table_name, filter_str)

def paginate_list(
    data_list: List[Any],
    pagination: Optional[PaginationRequest] = None
) -> Dict[str, Any]:
    """
    Paginate a list of data in memory
    
    Args:
        data_list: List of data to paginate
        pagination: Pagination parameters
        
    Returns:
        Paginated response with data and metadata
    """
    if pagination is None:
        pagination = PaginationRequest()
    
    total_count = len(data_list)
    start_idx = pagination.offset
    end_idx = start_idx + pagination.page_size
    
    paginated_data = data_list[start_idx:end_idx]
    has_more = end_idx < total_count
    
    return {
        "data": paginated_data,
        "pagination": {
            "page": pagination.page,
            "page_size": pagination.page_size,
            "total_count": total_count,
            "has_more": has_more,
            "returned_count": len(paginated_data)
        }
    }

# Cache warming functions
def warm_cache_for_common_queries():
    """Pre-populate cache with common query results"""
    logger.info("Warming cache with common queries")
    
    try:
        # Cache patient list
        common_pagination = PaginationRequest(page=1, page_size=50)
        paginate_supabase_query("PTSD", "group_identifier", pagination=common_pagination)
        
        # Cache assessment summary stats
        for assessment_type in ["ptsd", "phq", "gad", "who", "ders"]:
            # This would cache summary statistics
            pass
        
        logger.info("Cache warming completed")
        
    except Exception as e:
        logger.error("Cache warming failed", error=str(e))

def clear_cache():
    """Clear all cached data"""
    cache.clear()
    logger.info("Cache cleared")

# Cache statistics
def get_cache_stats() -> Dict[str, Any]:
    """Get cache performance statistics"""
    return {
        "cache_size": cache.size(),
        "max_cache_size": cache.max_size,
        "default_ttl_seconds": cache.default_ttl,
        "cache_utilization_percent": (cache.size() / cache.max_size) * 100
    }