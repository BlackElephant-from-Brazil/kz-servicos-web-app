import { supabase } from "@/lib/supabase";
import type {
  User,
  Trip,
  TripStatus,
  TripDriverCandidate,
  TripDriverCandidateStatus,
  TripStatusHistory,
  ServiceRequest,
  ServiceRequestStatus,
  DriverProfile,
  ProviderProfile,
  Vehicle,
  Address,
  ServiceCategory,
  Debito,
} from "@/types/database";

// ─── Auth ──────────────────────────────────────────────────
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

// ─── Users ─────────────────────────────────────────────────
export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as User[];
}

// ─── Clients ───────────────────────────────────────────────
export async function fetchClients(): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", "client")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as User[];
}

export async function fetchUserById(id: string): Promise<User> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as User;
}

// ─── Trips ─────────────────────────────────────────────────
export async function fetchTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from("trips")
    .select(
      "*, pickup_address:addresses!pickup_address_id(*), dropoff_address:addresses!dropoff_address_id(*), service_categories(*), users!client_id(*)"
    )
    .order("scheduled_datetime", { ascending: false });
  if (error) throw error;
  return data as Trip[];
}

// ─── Service Requests ──────────────────────────────────────
export async function fetchServiceRequests(): Promise<ServiceRequest[]> {
  const { data, error } = await supabase
    .from("service_requests")
    .select(
      "*, service_categories(*), addresses(*), users!client_id(*)"
    )
    .order("service_date", { ascending: false });
  if (error) throw error;
  return data as ServiceRequest[];
}

// ─── Update Trip Status ────────────────────────────────────
export async function updateTripStatus(id: string, status: TripStatus): Promise<void> {
  const { error } = await supabase
    .from("trips")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

// ─── Fetch Single Trip ─────────────────────────────────────
export async function fetchTripById(id: string): Promise<Trip> {
  const { data, error } = await supabase
    .from("trips")
    .select(
      "*, pickup_address:addresses!pickup_address_id(*), dropoff_address:addresses!dropoff_address_id(*), service_categories(*), users!client_id(*), driver_profiles(*, provider_profiles(*, users(*)))"
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Trip;
}

// ─── Trip Status History ───────────────────────────────────
export async function fetchTripStatusHistory(tripId: string): Promise<TripStatusHistory[]> {
  const { data, error } = await supabase
    .from("trip_status_history")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TripStatusHistory[];
}

// ─── Approve Trip (under_review → searching_drivers) ──────
export async function approveTrip(id: string): Promise<void> {
  const { error } = await supabase
    .from("trips")
    .update({ status: "searching_drivers" })
    .eq("id", id);
  if (error) throw error;
}

// ─── Reject Trip (under_review → open) ────────────────────
export async function rejectTrip(id: string, reason: string): Promise<void> {
  const trimmed = reason.trim();
  const { error } = await supabase.rpc("reject_trip", {
    p_trip_id: id,
    p_reason: trimmed.length > 0 ? trimmed : null,
  });
  if (error) throw error;
}

// ─── Cancel Trip (any → cancelled) ────────────────────────
export async function cancelTrip(id: string): Promise<void> {
  const { error } = await supabase
    .from("trips")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ─── Trip Driver Candidates ────────────────────────────────
export async function fetchTripDriverCandidates(tripId: string): Promise<TripDriverCandidate[]> {
  const { data, error } = await supabase
    .from("trip_driver_candidates")
    .select("*, driver_profiles(*, provider_profiles(*, users(*)))")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TripDriverCandidate[];
}

export async function addTripDriverCandidate(
  tripId: string,
  driverProfileId: string
): Promise<TripDriverCandidate> {
  const { data, error } = await supabase
    .from("trip_driver_candidates")
    .insert({ trip_id: tripId, driver_profile_id: driverProfileId, status: "pending" })
    .select("*, driver_profiles(*, provider_profiles(*, users(*)))")
    .single();
  if (error) throw error;
  return data as TripDriverCandidate;
}

export async function removeTripDriverCandidate(
  tripId: string,
  driverProfileId: string
): Promise<void> {
  const { error } = await supabase
    .from("trip_driver_candidates")
    .delete()
    .eq("trip_id", tripId)
    .eq("driver_profile_id", driverProfileId);
  if (error) throw error;
}

export async function updateTripDriverCandidateStatus(
  tripId: string,
  driverProfileId: string,
  status: TripDriverCandidateStatus
): Promise<TripDriverCandidate> {
  const { data, error } = await supabase
    .from("trip_driver_candidates")
    .update({
      status,
      responded_at: status === "pending" ? null : new Date().toISOString(),
    })
    .eq("trip_id", tripId)
    .eq("driver_profile_id", driverProfileId)
    .select("*, driver_profiles(*, provider_profiles(*, users(*)))")
    .single();
  if (error) throw error;
  return data as TripDriverCandidate;
}

// ─── Update Service Request Status ─────────────────────────
export async function updateServiceRequestStatus(
  id: string,
  status: ServiceRequestStatus
): Promise<void> {
  const { error } = await supabase
    .from("service_requests")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

// ─── Driver Profiles ───────────────────────────────────────

// ─── Débitos (Financeiro) ──────────────────────────────────
export async function fetchDebitos(): Promise<Debito[]> {
  const [trips, serviceRequests] = await Promise.all([
    fetchTrips(),
    fetchServiceRequests(),
  ]);

  const tripDebitos: Debito[] = trips
    .filter((t) => t.status !== "cancelled")
    .map((t) => ({
      id: t.id,
      tipo: "viagem" as const,
      descricao: t.pickup_address?.formatted_address
        ? `${t.pickup_address.formatted_address.split(",")[0]} → ${t.dropoff_address?.formatted_address?.split(",")[0] ?? "—"}`
        : "Viagem",
      cliente: t.users?.full_name ?? "—",
      categoria: t.service_categories?.name ?? "Viagem",
      data: t.scheduled_datetime,
      valor_estimado: t.estimated_price,
      valor_final: t.final_price,
      pago: t.is_paid,
      metodo_pagamento: t.payment_method,
    }));

  const serviceDebitos: Debito[] = serviceRequests
    .filter((r) => r.status !== "cancelled")
    .map((r) => ({
      id: r.id,
      tipo: "servico" as const,
      descricao:
        r.description.length > 60
          ? r.description.slice(0, 60) + "…"
          : r.description,
      cliente: r.users?.full_name ?? "—",
      categoria: r.service_categories?.name ?? "Serviço",
      data: r.service_date,
      valor_estimado: r.estimated_price,
      valor_final: r.final_price,
      pago: r.is_paid,
      metodo_pagamento: r.payment_method,
    }));

  return [...tripDebitos, ...serviceDebitos].sort(
    (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
  );
}

// ─── Driver Profiles ───────────────────────────────────────
export async function fetchDriverProfiles(): Promise<DriverProfile[]> {
  const { data, error } = await supabase
    .from("driver_profiles")
    .select("*, provider_profiles(*, users(*))");
  if (error) throw error;
  return data as DriverProfile[];
}

export async function fetchVehiclesByDriver(
  driverProfileId: string
): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("driver_profile_id", driverProfileId);
  if (error) throw error;
  return data as Vehicle[];
}

// ─── Provider Profiles ─────────────────────────────────────
export async function fetchProviderProfiles(): Promise<ProviderProfile[]> {
  const { data, error } = await supabase
    .from("provider_profiles")
    .select("*, users(*), service_categories(*)");
  if (error) throw error;
  return data as ProviderProfile[];
}

// ─── Dashboard Stats ───────────────────────────────────────
export async function fetchDashboardStats() {
  const [
    { count: totalTrips },
    { count: totalServices },
    { count: totalDrivers },
    { count: totalProviders },
    recentTrips,
    recentServices,
  ] = await Promise.all([
    supabase.from("trips").select("*", { count: "exact", head: true }),
    supabase.from("service_requests").select("*", { count: "exact", head: true }),
    supabase.from("driver_profiles").select("*", { count: "exact", head: true }),
    supabase.from("provider_profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("trips")
      .select(
        "id, status, scheduled_datetime, users!client_id(full_name), pickup_address:addresses!pickup_address_id(formatted_address), dropoff_address:addresses!dropoff_address_id(formatted_address)"
      )
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("service_requests")
      .select(
        "id, status, service_date, description, users!client_id(full_name), service_categories(name)"
      )
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return {
    totalTrips: totalTrips ?? 0,
    totalServices: totalServices ?? 0,
    totalDrivers: totalDrivers ?? 0,
    totalProviders: totalProviders ?? 0,
    recentTrips: recentTrips.data ?? [],
    recentServices: recentServices.data ?? [],
  };
}

// ─── Service Categories ────────────────────────────────────
export async function fetchServiceCategories(): Promise<ServiceCategory[]> {
  const { data, error } = await supabase
    .from("service_categories")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data as ServiceCategory[];
}

// ─── Addresses ─────────────────────────────────────────────
export async function createAddress(address: {
  formatted_address: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}) {
  const { data, error } = await supabase
    .from("addresses")
    .insert(address)
    .select()
    .single();
  if (error) throw error;
  return data as Address;
}

// ─── Create Trip ───────────────────────────────────────────
export async function createTrip(trip: {
  client_id: string;
  service_category_id: string;
  pickup_address_id: string;
  dropoff_address_id: string;
  scheduled_datetime: string;
  is_round_trip: boolean;
  return_datetime?: string | null;
  passenger_count: number;
  children_count?: number;
  luggage_count?: number;
  observations?: string | null;
  payment_method?: string | null;
}) {
  const { data, error } = await supabase
    .from("trips")
    .insert({ ...trip, status: "open" })
    .select()
    .single();
  if (error) throw error;
  return data as Trip;
}

// ─── Create Service Request ────────────────────────────────
export async function createServiceRequest(req: {
  client_id: string;
  service_category_id: string;
  service_date: string;
  description: string;
  address_id?: string | null;
  observations?: string | null;
}) {
  const { data, error } = await supabase
    .from("service_requests")
    .insert({ ...req, status: "open" })
    .select()
    .single();
  if (error) throw error;
  return data as ServiceRequest;
}

// ─── Create User ───────────────────────────────────────────
export async function createUser(user: {
  full_name: string;
  email: string;
  phone?: string | null;
  cpf?: string | null;
  role: string;
  date_of_birth?: string | null;
}) {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao criar usuário");
  return data as User;
}

// ─── Create Provider Profile ───────────────────────────────
export async function createProviderProfile(profile: {
  user_id: string;
  service_category_id: string;
  bio?: string | null;
  has_card_machine?: boolean;
  issues_invoice?: boolean;
}) {
  const { data, error } = await supabase
    .from("provider_profiles")
    .insert({ ...profile, status: "pending" })
    .select()
    .single();
  if (error) throw error;
  return data as ProviderProfile;
}

// ─── Create Driver Profile ─────────────────────────────────
export async function createDriverProfile(profile: {
  provider_profile_id: string;
  cnh_number?: string | null;
  cnh_category?: string | null;
  cnh_expiration_date?: string | null;
}) {
  const { data, error } = await supabase
    .from("driver_profiles")
    .insert({ ...profile, is_available: false })
    .select()
    .single();
  if (error) throw error;
  return data as DriverProfile;
}

// ─── Create Vehicle ────────────────────────────────────────
export async function createVehicle(vehicle: {
  driver_profile_id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  passenger_capacity: number;
}) {
  const { data, error } = await supabase
    .from("vehicles")
    .insert({ ...vehicle, is_active: true })
    .select()
    .single();
  if (error) throw error;
  return data as Vehicle;
}
