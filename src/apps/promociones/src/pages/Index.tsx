import { useState } from "react";
import { PromotionFilters } from "@resoluciones/components/PromotionFilters";
import { PromotionDialog } from "@resoluciones/components/PromotionDialog";
import { YearCalendar } from "@resoluciones/components/YearCalendar";
import { MonthCalendar } from "@resoluciones/components/MonthCalendar";
import { WeekCalendar } from "@resoluciones/components/WeekCalendar";
import { DayCalendar } from "@resoluciones/components/DayCalendar";
import { mockPromotions } from "@resoluciones/data/mockPromotions";
import { Promotion, PromotionType, PromotionDuration } from "@resoluciones/types/promotion";
import { NewPromotionButton } from "@resoluciones/components/NewPromotionButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@resoluciones/components/ui/tabs";
import { Calendar, TrendingUp, List } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@resoluciones/components/ui/select";
import { PromotionListPanel } from "@resoluciones/components/PromotionListPanel";
import { startOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, addMonths, addDays } from "date-fns";

const Index = () => {
  const [promotions, setPromotions] = useState<Promotion[]>(mockPromotions);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<PromotionType[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<PromotionDuration[]>(["temporal"]);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("year");

  // 🔹 Filtrado
  const filteredPromotions = promotions.filter((promo) => {
    const storeMatch =
      selectedStores.length === 0 ||
      promo.stores.some((store) => selectedStores.includes(store));
    const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(promo.type);
    const durationMatch = selectedDurations.length === 0 || selectedDurations.includes(promo.duration);
    return storeMatch && typeMatch && durationMatch;
  });

  const handlePromotionClick = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setDialogOpen(true);
  };

  // 🔹 Cambios de filtros
  const handleStoreChange = (store: string) => {
    setSelectedStores(prev => prev.includes(store) ? prev.filter(s => s !== store) : [...prev, store]);
  };

  const handleTypeChange = (type: PromotionType) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const handleDurationChange = (duration: PromotionDuration | null) => {
    setSelectedDurations(duration ? [duration] : []);
  };

  // 🔹 Selección de año
  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    const newDate = new Date(year, selectedMonth, 1);
    setSelectedDate(newDate);
    setSelectedMonth(newDate.getMonth());
    setSelectedWeek(0); // primera semana del mes
    setActiveTab("year");
  };

  // 🔹 Cambio de año desde la vista anual (flechas de YearCalendar)
  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear);
    const newDate = new Date(newYear, 0, 1); // primer día del año
    setSelectedMonth(0); // primer mes
    setSelectedWeek(0); // primera semana del mes
    setSelectedDate(newDate); // sincroniza fecha principal
    setActiveTab("year"); // asegura que la vista activa siga siendo año
  };

  // 🔹 Selección de mes
  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    const newDate = new Date(selectedYear, month, 1);
    setSelectedDate(newDate);
    setSelectedWeek(0); // primera semana del mes
    setActiveTab("month");
  };

  // 🔹 Selección de semana por índice
  const handleWeekSelect = (weekIndex: number) => {
    setSelectedWeek(weekIndex);
    const firstDayOfMonth = startOfMonth(new Date(selectedYear, selectedMonth, 1));
    const weekStartDate = addWeeks(firstDayOfMonth, weekIndex);
    setSelectedDate(weekStartDate);
    setActiveTab("week");
  };

  // 🔹 Selección de día
  const handleDaySelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedYear(date.getFullYear());
    setSelectedMonth(date.getMonth());
    const firstDayOfMonth = startOfMonth(date);
    const weekIndex = Math.floor((date.getDate() + firstDayOfMonth.getDay() - 1) / 7);
    setSelectedWeek(weekIndex);
    setActiveTab("day");
  };

  // 🔹 Navegación con flechas
  const handlePreviousMonth = () => handleMonthSelect(selectedMonth - 1);
  const handleNextMonth = () => handleMonthSelect(selectedMonth + 1);
  const handlePreviousWeek = () => {
  const newDate = addWeeks(selectedDate, -1);
  setSelectedDate(newDate);
  setSelectedYear(newDate.getFullYear());
  setSelectedMonth(newDate.getMonth());

  // Calcular la semana del mes
  const firstDayOfMonth = startOfMonth(newDate);
  const newWeekIndex = Math.floor((newDate.getDate() + firstDayOfMonth.getDay() - 1) / 7);
  setSelectedWeek(newWeekIndex);
};

const handleNextWeek = () => {
  const newDate = addWeeks(selectedDate, 1);
  setSelectedDate(newDate);
  setSelectedYear(newDate.getFullYear());
  setSelectedMonth(newDate.getMonth());

  const firstDayOfMonth = startOfMonth(newDate);
  const newWeekIndex = Math.floor((newDate.getDate() + firstDayOfMonth.getDay() - 1) / 7);
  setSelectedWeek(newWeekIndex);
};
  const handlePreviousDay = () => handleDaySelect(addDays(selectedDate, -1));
  const handleNextDay = () => handleDaySelect(addDays(selectedDate, 1));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Sistema de Promociones
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestión y seguimiento de promociones en tiendas
            </p>
          </div>
          <div className="flex gap-2">
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => handleYearSelect(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
            <NewPromotionButton onCreate={(promo) => setPromotions(prev => [...prev, promo])} />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <PromotionFilters
              selectedStores={selectedStores}
              selectedTypes={selectedTypes}
              selectedDurations={selectedDurations}
              onStoreChange={handleStoreChange}
              onTypeChange={handleTypeChange}
              onDurationChange={handleDurationChange}
            />
          </aside>

          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Stats cards */}
            {/* ...igual que tu versión actual... */}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-2xl grid-cols-4">
                <TabsTrigger value="year">Año</TabsTrigger>
                <TabsTrigger value="month">Mes</TabsTrigger>
                <TabsTrigger value="week">Semana</TabsTrigger>
                <TabsTrigger value="day">Día</TabsTrigger>
              </TabsList>

              <TabsContent value="year">
                <YearCalendar
  year={selectedYear}
  promotions={filteredPromotions}
  onPromotionClick={handlePromotionClick}
  onMonthSelect={handleMonthSelect}
  onYearChange={handleYearChange} // 👈 aquí
/>
              </TabsContent>

              <TabsContent value="month">
                <MonthCalendar
                  year={selectedYear}
                  month={selectedMonth}
                  promotions={filteredPromotions}
                  onPromotionClick={handlePromotionClick}
                  onDaySelect={handleDaySelect}
                  onPreviousMonth={handlePreviousMonth}
                  onNextMonth={handleNextMonth}
                />
              </TabsContent>

              <TabsContent value="week">
                <WeekCalendar
                  year={selectedYear}
                  month={selectedMonth}
                  weekIndex={selectedWeek}
                  selectedDate={selectedDate} 
                  promotions={filteredPromotions}
                  onPromotionClick={handlePromotionClick}
                  onDaySelect={handleDaySelect}        // 🔹 agregar esta línea
                  onPreviousWeek={handlePreviousWeek}
                  onNextWeek={handleNextWeek}
                />
              </TabsContent>

              <TabsContent value="day">
                <DayCalendar
                  date={selectedDate}
                  promotions={filteredPromotions}
                  onPromotionClick={handlePromotionClick}
                  onPreviousDay={handlePreviousDay}
                  onNextDay={handleNextDay}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right panel */}
          <aside className="lg:col-span-1">
            <PromotionListPanel
              promotions={filteredPromotions}
              onPromotionClick={handlePromotionClick}
            />
          </aside>
        </div>
      </main>

      <PromotionDialog
        promotion={selectedPromotion}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default Index;
