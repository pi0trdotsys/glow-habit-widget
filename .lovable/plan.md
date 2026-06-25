## Co budujemy

Estetyczną PWA do śledzenia zdrowych nawyków w stylu Streaks, instalowalną na ekranie głównym Androida, działającą offline, z dedykowanym ekranem "Widget" pozwalającym oznaczać nawyki jako wykonane bez wchodzenia w pełną aplikację. Ukończenie nawyku to przytrzymanie (long-press), nie zwykły tap — zapobiega przypadkowemu zaznaczeniu.

Uwaga: prawdziwy natywny widżet na ekran główny Androida wymagałby aplikacji w Kotlinie (poza Lovable). Najbliższy odpowiednik w PWA to skrót do `/widget` na ekranie głównym — otwiera się natychmiast w trybie standalone i wygląda/zachowuje się jak widżet.

## Założenia (przyjęte za Ciebie)

- Bez logowania — dane lokalnie (localStorage), pełna prywatność. Sync można dodać później przez Lovable Cloud.
- Max 24 nawyki, jak w Streaks.
- Harmonogram: codziennie / dni tygodnia / X razy w tygodniu.
- Statystyki: bieżący streak, najdłuższy, heatmap, % ukończeń.
- Stylistyka: minimal, ciemny motyw domyślnie, kolorowe kafelki z pierścieniem postępu, własna tożsamość wizualna.

## Long-press do ukończenia

- Przytrzymanie ~600 ms na kafelku → wypełnia się pierścień postępu (wizualny feedback w czasie rzeczywistym), po pełnym wypełnieniu nawyk oznaczony jako zrobiony + krótka animacja + wibracja (Vibration API, jeśli dostępna).
- Puszczenie przed czasem = anuluj, pierścień się cofa.
- Tap (krótki) = otwiera szczegóły nawyku.
- Long-press na już ukończonym = cofnij ukończenie (z tym samym progiem).
- Wspólny hook `useHoldToComplete` używany na ekranie "Dziś" i "Widget".

## Offline (PWA z service workerem)

Zgodnie ze skillem PWA: `vite-plugin-pwa` z `generateSW`, `registerType: "autoUpdate"`, `NetworkFirst` dla HTML, `CacheFirst` dla zhashowanych assetów. Rejestracja SW tylko w produkcji (guard przeciw preview Lovable + `?sw=off` jako kill-switch). Dane nawyków i tak są w localStorage, więc aplikacja jest w pełni funkcjonalna offline — SW dba o app shell.

## Strony / routing

```
/           Dziś — lista dzisiejszych nawyków (long-press = done)
/habits     Wszystkie nawyki
/habits/new Kreator (ikona, kolor, harmonogram, cel)
/habits/$id Szczegóły: streak, heatmap, edycja
/widget     Kompaktowy "widżet" z long-press do ukończenia
/settings   Motyw, eksport/import JSON, reset, instrukcja "dodaj do ekranu głównego"
```

## Model danych (localStorage przez Zustand persist)

```ts
Habit { id, name, icon, color,
        schedule: { type: 'daily'|'weekdays'|'timesPerWeek', days?, target? },
        createdAt }
Completion { habitId, date: 'YYYY-MM-DD' }
```

Logika streaków, harmonogramu i statystyk w `src/lib/habits/`.

## Stack techniczny

- TanStack Start, Tailwind v4, shadcn/ui, framer-motion.
- Zustand + persist (localStorage).
- `date-fns`, `lucide-react`.
- `vite-plugin-pwa` (manifest + SW dla offline).
- Tokeny kolorów w `src/styles.css` (oklch, semantyczne).

## Kroki implementacji

1. Tokeny designu + paleta akcentów nawyków w `src/styles.css`.
2. `vite-plugin-pwa` z guardowaną rejestracją SW (offline app shell) + manifest + ikony.
3. Store nawyków (Zustand + persist) i utils: streak, isDueToday, heatmap.
4. Hook `useHoldToComplete` (long-press 600 ms z animowanym progresem + wibracja).
5. Layout z dolną nawigacją (Dziś / Nawyki / Widget / Ustawienia).
6. Ekran "Dziś" — kafelki z long-press i pierścieniem postępu.
7. Kreator nawyku.
8. Szczegóły nawyku z heatmapą i statystykami.
9. Ekran `/widget` — kompaktowa siatka, ten sam long-press, minimalny chrome.
10. Ustawienia + krótka instrukcja "Dodaj do ekranu głównego → wybierz /widget jako skrót".
11. Seed przykładowych nawyków przy pierwszym uruchomieniu.

## Czego świadomie NIE robię

- Natywny widżet Androida (wymaga Kotlina).
- Konta i sync w chmurze (możliwe później przez Lovable Cloud).
- Push notyfikacje (osobna konfiguracja FCM).
- Integracja z Google Fit.

Zaakceptuj plan, a zaczynam budować.