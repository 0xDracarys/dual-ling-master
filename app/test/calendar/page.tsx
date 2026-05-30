'use client';

import { useState } from 'react';
import { CalendarNew, RangeValue } from '@/components/ui/calendar-new';

export default function CalendarTestPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [rangeValue, setRangeValue] = useState<RangeValue | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">New Calendar Component Test</h1>
          <p className="text-gray-600 mb-8">
            Testing the new modern calendar component with timezone support
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Single Date Selection (Schedule Mode)</h2>
          <p className="text-sm text-gray-600 mb-4">
            This is how the calendar appears in the schedule class modal
          </p>
          <div className="max-w-md">
            <CalendarNew
              mode="single"
              selectedDate={selectedDate}
              onSelectSingle={setSelectedDate}
              disabled={(date: Date) => date < new Date()}
              value={null}
              onChange={() => {}}
              allowClear
            />
          </div>
          {selectedDate && (
            <div className="mt-4 p-4 bg-blue-50 rounded">
              <p className="text-sm">
                <strong>Selected Date:</strong> {selectedDate.toLocaleDateString()} at {selectedDate.toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Date Range Selection</h2>
          <p className="text-sm text-gray-600 mb-4">
            Testing range mode with timezone selector
          </p>
          <div className="max-w-md">
            <CalendarNew
              mode="range"
              value={rangeValue}
              onChange={setRangeValue}
              allowClear
            />
          </div>
          {rangeValue && rangeValue.start && rangeValue.end && (
            <div className="mt-4 p-4 bg-green-50 rounded">
              <p className="text-sm">
                <strong>Start:</strong> {rangeValue.start.toLocaleDateString()}<br />
                <strong>End:</strong> {rangeValue.end.toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">✅ Features Tested:</h3>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Single date selection mode (for schedule modal)</li>
            <li>Date range selection mode</li>
            <li>Timezone selector (UTC + Local)</li>
            <li>Past date disabling</li>
            <li>Clear button functionality</li>
            <li>Modern visual design</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
