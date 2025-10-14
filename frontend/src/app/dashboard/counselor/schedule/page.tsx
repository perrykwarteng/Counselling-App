"use client";

import { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer, Event } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CounselorSidebar } from "@/components/counselorSidebar/CounselorSidebar";
import { useAppointments } from "@/Context/AppointmentProviders";

const locales = {
  "en-US": require("date-fns/locale/en-US"),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface AppointmentEvent extends Event {
  id: string;
  status: "pending" | "accepted" | "rejected" | "cancelled" | "completed";
  mode: "chat" | "video" | "in-person";
}

export default function CounselorSchedulePage() {
  const { appointments, listMyAppointments, loadingList } = useAppointments();
  const [events, setEvents] = useState<AppointmentEvent[]>([]);

  useEffect(() => {
    async function load() {
      await listMyAppointments();
    }
    load();
  }, [listMyAppointments]);

  useEffect(() => {
    console.log("Appointments from API:", appointments);

    const mapped: AppointmentEvent[] = appointments.map((apt: any) => {
      // Convert scheduled_at to Date safely
      const startDate = new Date(apt.scheduled_at);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      console.log("Mapping appointment:", {
        id: apt._id,
        title: `${apt.mode} (${apt.status})`,
        start: startDate,
        end: endDate,
      });

      return {
        id: apt._id,
        title: `${apt.mode} (${apt.status})`,
        start: startDate,
        end: endDate,
        status: apt.status ?? "pending",
        mode: apt.mode,
      };
    });

    setEvents(mapped);
  }, [appointments]);

  const eventStyleGetter = (event: AppointmentEvent) => {
    let backgroundColor = "#2ecc71"; // green
    if (event.status === "pending") backgroundColor = "#f1c40f";
    if (event.status === "accepted") backgroundColor = "#3498db";
    if (event.status === "cancelled") backgroundColor = "#7f8c8d";
    if (event.status === "rejected") backgroundColor = "#e74c3c";
    if (event.status === "completed") backgroundColor = "#2ecc71";

    return {
      style: {
        backgroundColor,
        borderRadius: "8px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  return (
    <DashboardLayout title="Counselor Schedule" sidebar={<CounselorSidebar />}>
      <div className="p-6 bg-white rounded-xl shadow">
        <h1 className="text-2xl font-semibold mb-4">My Schedule</h1>

        {loadingList ? (
          <p>Loading appointments...</p>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            eventPropGetter={eventStyleGetter}
            views={["month", "week", "day", "agenda"]}
            defaultView="month"
            popup
          />
        )}
      </div>
    </DashboardLayout>
  );
}
