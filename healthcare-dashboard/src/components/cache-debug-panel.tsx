'use client'

import React, { useState, useEffect } from 'react'
import { comprehensiveDataService } from '@/lib/comprehensive-data-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Database, Clock, Users, FileText, Activity } from 'lucide-react'

export function CacheDebugPanel() {
  const [cacheInfo, setCacheInfo] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const updateCacheInfo = () => {
    const info = comprehensiveDataService.getCacheInfo()
    setCacheInfo(info)
  }

  useEffect(() => {
    updateCacheInfo()
    
    // Update cache info every 30 seconds
    const interval = setInterval(updateCacheInfo, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await comprehensiveDataService.refreshInBackground()
      updateCacheInfo()
    } catch (error) {
      console.error('Manual refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleClearCache = () => {
    comprehensiveDataService.clearCache()
    updateCacheInfo()
  }

  const formatCacheAge = (ageMs: number) => {
    const minutes = Math.floor(ageMs / 60000)
    const seconds = Math.floor((ageMs % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  if (!cacheInfo) {
    return null
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-sm">
          <Database className="h-4 w-4 text-blue-400" />
          Data Cache Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Cache Status</span>
          <Badge variant={cacheInfo.hasCache ? "default" : "secondary"}>
            {cacheInfo.hasCache ? "Active" : "Empty"}
          </Badge>
        </div>

        {cacheInfo.hasCache && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Cache Age
              </span>
              <span className="text-sm text-white">
                {formatCacheAge(cacheInfo.cacheAge)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Patients
                </span>
                <span className="text-white">{cacheInfo.dataStats.patients}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Assessments
                </span>
                <span className="text-white">{cacheInfo.dataStats.assessments}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Substance
                </span>
                <span className="text-white">{cacheInfo.dataStats.substanceHistory}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  PHP
                </span>
                <span className="text-white">{cacheInfo.dataStats.phpAssessments}</span>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleClearCache}
            className="flex-1 text-xs"
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 