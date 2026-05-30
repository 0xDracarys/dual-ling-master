import {
  addDays,
  addMonths, endOfDay,
  endOfMonth,
  endOfWeek, format, isEqual,
  isSameDay,
  isSameMonth, isToday,
  isValid,
  isWithinInterval, parse, startOfDay,
  startOfMonth,
  startOfWeek, sub,
  subDays, subHours, subMinutes,
  subMonths,
  subWeeks, subYears
} from "date-fns";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button-1";
import { Material } from "@/components/ui/material-1";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select-1";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { useClickOutside } from "@/components/ui/use-click-outside";
import clsx from "clsx";
import { enUS } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

const ClockIcon = () => (
  <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.5 8C14.5 11.5899 11.5899 14.5 8 14.5C4.41015 14.5 1.5 11.5899 1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8ZM16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8ZM8.75 4.75V4H7.25V4.75V7.875C7.25 8.18976 7.39819 8.48615 7.65 8.675L9.55 10.1L10.15 10.55L11.05 9.35L10.45 8.9L8.75 7.625V4.75Z"
      className="fill-gray-1000"
    />
  </svg>
);

const ArrowBottomIcon = ({ className }: { className?: string }) => (
  <svg
    height="16"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width="16"
    className={clsx("fill-gray-1000", className)}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.0607 5.49999L13.5303 6.03032L8.7071 10.8535C8.31658 11.2441 7.68341 11.2441 7.29289 10.8535L2.46966 6.03032L1.93933 5.49999L2.99999 4.43933L3.53032 4.96966L7.99999 9.43933L12.4697 4.96966L13 4.43933L14.0607 5.49999Z"
    />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg
    height="16"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width="16"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.5 14.0607L9.96966 13.5303L5.14644 8.7071C4.75592 8.31658 4.75592 7.68341 5.14644 7.29289L9.96966 2.46966L10.5 1.93933L11.5607 2.99999L11.0303 3.53032L6.56065 7.99999L11.0303 12.4697L11.5607 13L10.5 14.0607Z"
      className="fill-gray-700"
    />
  </svg>
);

const ArrowRightIcon = () => (
  <svg
    height="16"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width="16"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.50001 1.93933L6.03034 2.46966L10.8536 7.29288C11.2441 7.68341 11.2441 8.31657 10.8536 8.7071L6.03034 13.5303L5.50001 14.0607L4.43935 13L4.96968 12.4697L9.43935 7.99999L4.96968 3.53032L4.43935 2.99999L5.50001 1.93933Z"
      className="fill-gray-700"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    height="16"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width="16"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.5 0.5V1.25V2H10.5V1.25V0.5H12V1.25V2H14H15.5V3.5V13.5C15.5 14.8807 14.3807 16 13 16H3C1.61929 16 0.5 14.8807 0.5 13.5V3.5V2H2H4V1.25V0.5H5.5ZM2 3.5H14V6H2V3.5ZM2 7.5V13.5C2 14.0523 2.44772 14.5 3 14.5H13C13.5523 14.5 14 14.0523 14 13.5V7.5H2Z"
    />
  </svg>
);

const ClearIcon = () => (
  <svg
    height="16"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width="16"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.4697 13.5303L13 14.0607L14.0607 13L13.5303 12.4697L9.06065 7.99999L13.5303 3.53032L14.0607 2.99999L13 1.93933L12.4697 2.46966L7.99999 6.93933L3.53032 2.46966L2.99999 1.93933L1.93933 2.99999L2.46966 3.53032L6.93933 7.99999L2.46966 12.4697L1.93933 13L2.99999 14.0607L3.53032 13.5303L7.99999 9.06065L12.4697 13.5303Z"
    />
  </svg>
);

export interface RangeValue {
  start: Date | null;
  end: Date | null;
}

interface CalendarProps {
  allowClear?: boolean;
  compact?: boolean;
  isDocsPage?: boolean;
  stacked?: boolean;
  horizontalLayout?: boolean;
  showTimeInput?: boolean;
  popoverAlignment?: "start" | "center" | "end";
  value: RangeValue | null;
  onChange: (date: RangeValue | null) => void;
  presets?: {
    [key: string]: {
      text: string;
      start: Date;
      end: Date;
    };
  };
  presetIndex?: number;
  minValue?: Date;
  maxValue?: Date;
  // New props for single date mode
  mode?: 'single' | 'range';
  onSelectSingle?: (date: Date | undefined) => void;
  selectedDate?: Date | undefined;
  disabled?: (date: Date) => boolean;
}

export const CalendarNew = ({
  allowClear = false,
  compact = false,
  isDocsPage = false,
  stacked = false,
  horizontalLayout = false,
  showTimeInput = true,
  popoverAlignment = "start",
  value,
  onChange,
  presets,
  presetIndex,
  minValue,
  maxValue,
  mode = 'single',
  onSelectSingle,
  selectedDate,
  disabled
}: CalendarProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const timezones = useMemo(() => ([
    {
      value: "UTC",
      label: "UTC"
    },
    {
      value: Intl.DateTimeFormat().resolvedOptions().timeZone,
      label: `Local (${Intl.DateTimeFormat().resolvedOptions().timeZone})`
    }

  ]), []);
  const [selectedTimezone, setSelectedTimezone] = useState(timezones[1].value);
  const [startDate, setStartDate] = useState<string>(formatInTimeZone(value?.start || new Date(), selectedTimezone, "MMM dd, yyyy"));
  const [startTime, setStartTime] = useState<string>(formatInTimeZone(startOfDay(value?.start || new Date()), selectedTimezone, "HH:mm"));
  const [endDate, setEndDate] = useState<string>(formatInTimeZone(value?.end || new Date(), selectedTimezone, "MMM dd, yyyy"));
  const [endTime, setEndTime] = useState<string>(formatInTimeZone(endOfDay(value?.end || new Date()), selectedTimezone, "HH:mm"));
  const [startDateError, setStartDateError] = useState<boolean>(false);
  const [startTimeError, setStartTimeError] = useState<boolean>(false);
  const [endDateError, setEndDateError] = useState<boolean>(false);
  const [endTimeError, setEndTimeError] = useState<boolean>(false);
  const calendarRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(calendarRef, () => setIsOpen(false));

  useEffect(() => {
    window.addEventListener("resize", () => setIsOpen(false));
    window.addEventListener("scroll", () => setIsOpen(false));

    return () => {
      window.removeEventListener("resize", () => setIsOpen(false));
      window.removeEventListener("scroll", () => setIsOpen(false));
    };
  }, []);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const daysArray = [];
  let day = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
  while (day <= endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })) {
    daysArray.push(day);
    day = addDays(day, 1);
  }

  const handleDateClick = (day: Date) => {
    if (mode === 'single') {
      // Single date selection mode
      if (onSelectSingle) {
        onSelectSingle(day);
      }
      setIsOpen(false);
    } else {
      // Range selection mode
      if (!value?.start || (value.start && value.end)) {
        onChange({ start: startOfDay(day), end: null });
        setHoverDate(day);
        setIsSelecting(true);
      } else if (isSelecting) {
        if (day > value.start) {
          onChange({ ...value, end: endOfDay(day) });
        } else {
          onChange({ start: startOfDay(day), end: endOfDay(value.start) });
        }
        setIsSelecting(false);
        setHoverDate(null);
        setIsOpen(false);
      }
    }
  };

  const handleMouseEnter = (day: Date) => {
    if (mode === 'range' && value?.start && !value.end) {
      setHoverDate(day);
    }
  };

  const onApply = () => {
    const parsedStartDate = parse(startDate, "MMM dd, yyyy", new Date());
    const parsedStartTime = parse(startTime || "", "HH:mm", new Date());
    const parsedEndDate = parse(endDate, "MMM dd, yyyy", new Date());
    const parsedEndTime = parse(endTime || "", "HH:mm", new Date());

    if (
      parsedStartDate.toString() === "Invalid Date" ||
      parsedStartTime.toString() === "Invalid Date" ||
      parsedEndDate.toString() === "Invalid Date" ||
      parsedEndTime.toString() === "Invalid Date"
    ) {
      setStartDateError(parsedStartDate.toString() === "Invalid Date");
      setStartTimeError(parsedStartTime.toString() === "Invalid Date");
      setEndDateError(parsedEndDate.toString() === "Invalid Date");
      setEndTimeError(parsedEndTime.toString() === "Invalid Date");
    } else {
      setStartDateError(false);
      setStartTimeError(false);
      setEndDateError(false);
      setEndTimeError(false);
      const parsedStart = parse(`${startDate} ${startTime}`, "MMM d, yyyy HH:mm", new Date());
      const parsedEnd = parse(`${endDate} ${endTime}`, "MMM d, yyyy HH:mm", new Date());
      onChange({
        start: fromZonedTime(parsedStart, selectedTimezone),
        end: fromZonedTime(parsedEnd, selectedTimezone)
      });
    }
  };

  useEffect(() => {
    setStartDate(formatInTimeZone(value?.start || new Date(), selectedTimezone, "MMM dd, yyyy"));
    setStartTime(formatInTimeZone(value?.start || startOfDay(new Date()), selectedTimezone, "HH:mm"));
    setEndDate(formatInTimeZone(value?.end || new Date(), selectedTimezone, "MMM dd, yyyy"));
    setEndTime(formatInTimeZone(value?.end || endOfDay(new Date()), selectedTimezone, "HH:mm"));
  }, [isOpen, value]);

  // Determine display text for single mode
  const getSingleDateDisplay = () => {
    if (mode === 'single' && selectedDate) {
      return formatInTimeZone(selectedDate, selectedTimezone, "EEE, MMM d");
    }
    return "Select Date";
  };

  return (
    <div className="relative w-full">
      <div className="flex justify-between items-center">
        <div className="relative w-full">
          <Button
            className="!justify-start focus:!border-transparent focus:!shadow-focus-input w-full"
            prefix={<CalendarIcon />}
            type="secondary"
            onClick={() => setIsOpen((prevState) => !prevState)}
          >
            <div className="truncate pr-4">
              {mode === 'single' ? getSingleDateDisplay() : 
                (value?.start && value?.end ?
                  format(value.start, "PPP")
                  : "Select Date"
                )
              }
            </div>
          </Button>
          {mode === 'single' && selectedDate && allowClear && (
            <Button
              aria-label="Clear input value"
              svgOnly
              variant="unstyled"
              className="absolute right-0 top-1/2 -translate-y-1/2 fill-gray-700 hover:fill-gray-1000"
              onClick={() => onSelectSingle && onSelectSingle(undefined)}
            >
              <ClearIcon />
            </Button>
          )}
        </div>
      </div>
      {isOpen && (
        <Material
          ref={calendarRef}
          type="menu"
          className={twMerge(clsx(
            "p-3 font-sans absolute top-12 z-[9999] left-0",
            "w-[280px]"
          ))}
        >
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm text-gray-1000 font-medium">
                {formatInTimeZone(currentDate, selectedTimezone, "MMMM yyyy")}
              </h2>
              <div className="flex gap-0.5">
                <Button variant="unstyled" onClick={prevMonth}><ArrowLeftIcon /></Button>
                <Button variant="unstyled" onClick={nextMonth}><ArrowRightIcon /></Button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-gray-900 uppercase mb-2">
              <div>M</div>
              <div>T</div>
              <div>W</div>
              <div>T</div>
              <div>F</div>
              <div>S</div>
              <div>S</div>
            </div>
            <div className="grid grid-cols-7 items-center gap-y-2">
              {daysArray.map((day) => {
                const isStart = mode === 'single' 
                  ? selectedDate && isSameDay(day, selectedDate)
                  : value?.start && isSameDay(day, value.start);
                const isEnd = mode === 'range' && value?.end && isSameDay(day, value.end);
                const currentHover = mode === 'range' && hoverDate && isSelecting && isSameDay(day, hoverDate);
                const isInRange = mode === 'range' &&
                  value?.start &&
                  ((value.end && isWithinInterval(day, { start: value.start, end: value.end })) ||
                    (hoverDate && isWithinInterval(day, { start: value.start, end: hoverDate })));
                const isDisabled = disabled ? disabled(day) : false;
                const isAllowedDate = !isDisabled && (minValue ? day >= minValue : true) && (maxValue ? day <= maxValue : true);

                return (
                  <div
                    key={day.toString()}
                    className={clsx(
                      "flex items-center justify-center text-sm text-center rounded transition",
                      isSameMonth(day, currentDate) && isAllowedDate ? "bg-background-100 text-gray-1000" : "bg-background-100 text-gray-700",
                      mode === 'range' && isInRange && !isStart && !isEnd && !currentHover && "!bg-accents-2 rounded-none",
                      isAllowedDate ? "cursor-pointer" : "cursor-not-allowed"
                    )}
                    onMouseEnter={() => isAllowedDate && handleMouseEnter(day)}
                    onClick={() => isAllowedDate && handleDateClick(day)}
                  >
                    <div className={clsx(
                      "h-8 w-8 flex items-center justify-center rounded",
                      (isStart || isEnd || currentHover) && isAllowedDate && " !bg-gray-1000 !text-background-100",
                      !isStart && !isEnd && !currentHover && !isToday(day) && isAllowedDate && "hover:text-gray-1000 hover:border hover:border-gray-alpha-500",
                      currentHover && isAllowedDate && " !shadow-focus-calendar-date",
                      isToday(day) && " !bg-blue-900 !text-background-100"
                    )}>
                      {format(day, "d")}
                    </div>
                  </div>
                );
              })}
            </div>
            {mode === 'single' && (
              <div className="mt-3 pt-2.5 border-t border-gray-alpha-100">
                <div className="w-fit self-center mx-auto">
                  <Select
                    size="xsmall"
                    variant="ghost"
                    options={timezones}
                    value={selectedTimezone}
                    onChange={(event) => setSelectedTimezone(event.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </Material>
      )}
    </div>
  );
};
