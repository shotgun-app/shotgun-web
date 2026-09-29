/** Morning until 11:59, afternoon until 17:59, evening otherwise (including late night). */
export function greetingFor(now: Date): string {
  const hour = now.getHours()
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 18) return 'Good afternoon'
  return 'Good evening'
}
