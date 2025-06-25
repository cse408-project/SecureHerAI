import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
// @ts-ignore
import CalendarPicker from "react-native-calendar-picker";
import { MaterialIcons } from "@expo/vector-icons";

interface DatePickerProps {
  value: string;
  onDateChange: (date: string) => void;
  placeholder?: string;
  label: string;
  required?: boolean;
  allowFutureDates?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export default function DatePicker({
  value,
  onDateChange,
  placeholder = "Select Date",
  label,
  required = false,
  allowFutureDates = false,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD format
    onDateChange(formattedDate);
    setShowCalendar(false);
  };

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-2">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>

      <TouchableOpacity
        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white flex-row items-center justify-between"
        onPress={() => setShowCalendar(true)}
        activeOpacity={0.7}
      >
        <Text className={`flex-1 ${value ? "text-gray-900" : "text-gray-400"}`}>
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
        <MaterialIcons name="calendar-today" size={20} color="#67082F" />
      </TouchableOpacity>

      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white rounded-xl p-6 w-full max-w-sm shadow-lg">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-[#67082F]">
                Select Date
              </Text>
              <TouchableOpacity
                onPress={() => setShowCalendar(false)}
                className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
              >
                <MaterialIcons name="close" size={20} color="#67082F" />
              </TouchableOpacity>
            </View>

            <CalendarPicker
              onDateChange={handleDateChange}
              selectedDayColor="#67082F"
              selectedDayTextColor="#FFFFFF"
              todayBackgroundColor="#FFE4D6"
              todayTextStyle={{ color: "#67082F" }}
              textStyle={{
                fontFamily: "System",
                color: "#333",
              }}
              customDatesStyles={[]}
              previousTitleStyle={{ color: "#67082F" }}
              nextTitleStyle={{ color: "#67082F" }}
              monthTitleStyle={{ color: "#67082F", fontWeight: "bold" }}
              yearTitleStyle={{ color: "#67082F", fontWeight: "bold" }}
              dayLabelsWrapper={{
                borderTopWidth: 0,
                borderBottomWidth: 0,
              }}
              weekdays={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}
              months={[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ]}
              scaleFactor={375}
              minDate={minDate}
              maxDate={maxDate || (allowFutureDates ? undefined : new Date())}
              width={280}
              height={350}
            />

            <View className="flex-row space-x-3 mt-4">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-lg p-3"
                onPress={() => setShowCalendar(false)}
              >
                <Text className="text-center text-gray-700 font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>

              {selectedDate && (
                <TouchableOpacity
                  className="flex-1 bg-[#67082F] rounded-lg p-3"
                  onPress={() => {
                    if (selectedDate) {
                      handleDateChange(selectedDate);
                    }
                  }}
                >
                  <Text className="text-center text-white font-semibold">
                    Select
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
