import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Calendar = ({
  onSelectDate,
  selectedDate,
  skippedDates,
  allowedDates,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const skippedDatesSet = new Set(
    skippedDates.map((d) => {
      const date = new Date(d);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(date.getDate()).padStart(2, "0")}`;
    })
  );
  const allowedDatesSet = allowedDates
    ? new Set(
        allowedDates.map((d) => {
          const date = new Date(d);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(date.getDate()).padStart(2, "0")}`;
        })
      )
    : null;

  const handleMonthChange = (increment) => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + increment);
      return newMonth;
    });
  };

  const isOriginalMonth = () => {
    const today = new Date();
    return (
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const renderCalendar = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dates = [];
    const dayHeaders = ["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
      <View key={`${day}-${index}`} style={styles.dayHeader}>
        <Text style={styles.dayHeaderText}>{day}</Text>
      </View>
    ));

    for (let i = 0; i < firstDayOfMonth; i++) {
      dates.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateString = `${year}-${String(month + 1).padStart(
        2,
        "0"
      )}-${String(i).padStart(2, "0")}`;
      const isPastOrToday = date <= today;
      const isSkipped = skippedDatesSet.has(dateString);
      const isAllowed = allowedDatesSet
        ? allowedDatesSet.has(dateString)
        : true;
      const isSelected =
        selectedDate && date.getTime() === selectedDate.getTime();

      const isDisabled = isPastOrToday || isSkipped || !isAllowed;

      dates.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.calendarDay,
            isSelected && styles.selectedDay,
            isDisabled && styles.disabledDay,
          ]}
          onPress={() => !isDisabled && onSelectDate(date)}
          disabled={isDisabled}
        >
          <View
            style={[
              styles.calendarDayInner,
              isSelected && styles.selectedDay,
              isDisabled && styles.disabledDay,
            ]}
          >
            <Text
              style={[
                styles.calendarDayText,
                isSelected && styles.selectedDayText,
                isDisabled && styles.disabledDayText,
              ]}
            >
              {i}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <>
        <View style={styles.dayHeadersContainer}>{dayHeaders}</View>
        <View style={styles.datesContainer}>{dates}</View>
      </>
    );
  };

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.monthHeader}>
        <TouchableOpacity
          onPress={() => handleMonthChange(-1)}
          disabled={isOriginalMonth()}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={isOriginalMonth() ? "#ccc" : "#000"}
          />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {currentMonth.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </Text>
        <TouchableOpacity onPress={() => handleMonthChange(1)}>
          <Ionicons name="chevron-forward" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      {renderCalendar()}
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    width: "100%",
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  monthText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  dayHeadersContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  dayHeader: {
    width: 40,
    alignItems: "center",
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#888",
  },
  datesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  calendarDay: {
    width: `${100 / 7}%`,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  calendarDayInner: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
  },
  calendarDayText: {
    fontSize: 16,
  },
  selectedDay: {
    backgroundColor: "#f8d56f",
    borderRadius: 1000,
  },
  selectedDayText: {
    color: "#000",
    fontWeight: "bold",
  },
  disabledDay: {
    backgroundColor: "#fff",
  },
  disabledDayText: {
    color: "#ccc",
  },
});

export default Calendar;
