import React from 'react';
import { Database, AlertCircle, CheckCircle } from 'lucide-react';
import { RedisInfo } from '../types';

interface Props {
  redisInfo: RedisInfo | null;
  hasItemHistory: boolean;
}

export default function DataSourceStatus({ redisInfo, hasItemHistory }: Props) {
  const hasRedisError = redisInfo?.error !== undefined;
  const hasRedisData = !hasRedisError && redisInfo !== null;

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-md">
      <Database className="w-4 h-4 text-gray-400" />
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-600">Redis:</span>
          {hasRedisError ? (
            <span className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="w-4 h-4" />
              Error
            </span>
          ) : hasRedisData ? (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              Disponible
            </span>
          ) : (
            <span className="flex items-center gap-1 text-gray-500">
              <AlertCircle className="w-4 h-4" />
              No disponible
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-600">Historial:</span>
          {hasItemHistory ? (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              Disponible
            </span>
          ) : (
            <span className="flex items-center gap-1 text-gray-500">
              <AlertCircle className="w-4 h-4" />
              No disponible
            </span>
          )}
        </div>
      </div>
    </div>
  );
}