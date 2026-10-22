/**
 * Default neutral doctor avatar placeholder (clean medical silhouette on soft slate background).
 * Used when a doctor has not uploaded a profile picture, avoiding random stock photos.
 */
export const DEFAULT_DOCTOR_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='24' fill='%23F1F5F9'/%3E%3Ccircle cx='60' cy='46' r='20' fill='%2394A3B8'/%3E%3Cpath d='M26 102 C26 78 41 72 60 72 C79 72 94 78 94 102 Z' fill='%2394A3B8'/%3E%3C/svg%3E";

export function getDoctorAvatar(photo?: string | null): string {
  if (!photo || !photo.trim()) {
    return DEFAULT_DOCTOR_AVATAR;
  }
  return photo;
}
