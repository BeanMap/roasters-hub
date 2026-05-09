# Usability Testing Design — BeenMap

> Data: 2026-05-09 | Autor: @AGENT | Status: ✅ Design zatwierdzony

## Cel

Przeprowadzenie kompleksowych testów użyteczności aplikacji BeenMap w 4 obszarach:
1. Wyszukiwanie i przeglądanie informacji
2. Dodawanie palarni i kawiarni (wizardy rejestracji)
3. Dodawanie zdjęć (upload, limity, galeria)
4. Dodawanie komentarzy i recenzji

**Metoda:** Seed kont testowych (przez Clerk API) → manualne scenariusze testowe → dokumentacja problemów + rekomendacje techniczne. Bez implementacji w tej sesji.

---

## Sekcja 1: Konta testowe

### Implementacja

Plik `web/prisma/seed_test_users.ts` — tworzy 4 konta przez Clerk Backend API + UserProfile w PostgreSQL.

**Wymagania:**
- `CLERK_SECRET_KEY` w `.env.local` (dostępny)
- `@clerk/backend` w dependencies (już jest)

**Konta:**

| Login | Hasło | Rola | Clerk publicMetadata | Do czego |
|-------|-------|------|---------------------|----------|
| `tester@beanmap.test` | `BeanTest2026!` | (brak) | `{}` | Zwykły user — zdjęcia, recenzje, testy limitów |
| `tester-roaster@beanmap.test` | `BeanTest2026!` | ROASTER | `{role: "ROASTER"}` | Właściciel palarni — edycja profilu, upload |
| `tester-cafe@beanmap.test` | `BeanTest2026!` | CAFE | `{role: "CAFE"}` | Właściciel kawiarni — edycja profilu |
| `tester-admin@beanmap.test` | `BeanTest2026!` | ADMIN | `{role: "ADMIN"}` | Moderacja zdjęć/recenzji, ustawienia limitów |

**Właściwości seeda:**
- Idempotentny — sprawdza istnienie przed utworzeniem
- Wypisuje gotowe dane do logowania na konsolę
- Uruchamiany: `npx tsx prisma/seed_test_users.ts`

---

## Sekcja 2: Wyszukiwanie, przeglądanie, języki, adresy

### 2A: Wyszukiwanie i filtry

| # | Scenariusz | Kroki | Kryterium sukcesu |
|---|-----------|-------|-------------------|
| 1 | Znajdź palarnię po nazwie | Strona główna → `/roasters` → wpisz "Tim Wendelboe" → profil | Znaleziona w <3s, poprawny profil |
| 2 | Filtruj po kraju | `/roasters` → filtr "Poland" | Tylko polskie palarnie |
| 3 | Filtruj po certyfikatach | `/roasters` → filtr "Organic" | Tylko palarnie z certyfikatem Organic |
| 4 | Znajdź kawiarnię po mieście | `/cafes` → wyszukaj → wejdź na `/country/city` | Poprawna strona miasta |
| 5 | Mapa z profilu | Profil → kliknij mapę → Leaflet | Pinezka w dobrej lokalizacji |
| 6 | Paginacja z filtrami | Strona 2 → powrót na 1 | URL zachowuje filtry |

### 2B: Języki (EN, PL, DE)

| # | Scenariusz | Kroki | Kryterium |
|---|-----------|-------|-----------|
| 7 | Przełącz EN→PL→DE na stronie głównej | Language switcher 3 razy | UI zmienia się, treści przetłumaczone |
| 8 | Język na `/roasters` | EN → PL → sprawdź filtry, etykiety | Filtry przetłumaczone, URL `/pl/roasters` |
| 9 | Język na profilu palarni | EN → DE na profilu | UI w DE, opisy mogą być w oryginale |
| 10 | **Język przy rejestracji — zapamiętanie stanu** | `/register` krok 1 wypełniony → **przełącz język na PL** → wróć do kroku 1 | Dane z kroku 1 NIE zniknęły (localStorage), URL `/pl/register`, wizard kontynuuje |
| 11 | Język przy rejestracji kawiarni | To samo dla `/register/cafe` | Stan zachowany po zmianie języka |

### 2C: Autouzupełnianie adresów (szczegółowo)

| # | Scenariusz | Kroki | Kryterium |
|---|-----------|-------|-----------|
| 12 | Podpowiadanie miasta — polskie znaki | `/register` krok 1 → wpisz "Wrocław" | "Wrocław, Lower Silesia, Poland" |
| 13 | Partial input | Wpisz "Warsz" | "Warsaw, Masovia, Poland" na liście |
| 14 | Wybór z listy → mapa | Kliknij "Warsaw" | MiniMap centruje się, marker ustawiony |
| 15 | Ręczny adres — ulica | "Marszałkowska 1, Warsaw" | Nominatim znajduje, mapa pokazuje lokalizację |
| 16 | Adres spoza Polski | "Kreuzberg, Berlin" | Podpowiedzi z Niemiec, mapa się aktualizuje |
| 17 | Brak wyników | "asdfghjkl123" | Jasny komunikat "nie znaleziono" |
| 18 | Szybkie klikanie | Szybko wpisz "Berlin" → kliknij podpowiedź | Brak race condition, wybór się rejestruje |
| 19 | Autocomplete na dashboardzie | `/dashboard/roaster` → edycja adresu | To samo co wyżej dla właściciela |
| 20 | Współrzędne z adresu | Wybierz adres → sprawdź lat/lng | Współrzędne zapisane, mapa pokazuje pinezkę |

**Oceniane aspekty:**
- Czy zmiana języka NIE czyści formularzy (localStorage powinien przetrwać)
- Czy autocomplete działa z polskimi znakami, adresami z różnych krajów
- Czy przy braku wyników jest jasny feedback
- Czy szybkie interakcje nie powodują race condition
- Czy wybór adresu poprawnie ustawia mapę i współrzędne

---

## Sekcja 3: Dodawanie palarni i kawiarni

### 3A: Rejestracja palarni (wizard `/register`)

| # | Scenariusz | Kroki | Kryterium |
|---|-----------|-------|-----------|
| 21 | Happy path | `tester-roaster` → `/register` → krok 1 (nazwa, kraj, miasto, opis, adres) → krok 2 (www, social, certyfikaty, origins, roast style, opening hours) → krok 3 (zgoda) → submit | Przekierowanie do dashboardu, palarnia PENDING |
| 22 | Puste pole nazwy | Krok 1 → pusta nazwa → próbuj dalej | Czerwony komunikat, blokada przejścia |
| 23 | Za krótki opis | Opis "ok" (2 znaki) | Komunikat o minimalnej długości |
| 24 | Brak współrzędnych | Ręcznie wpisz adres bez wyboru z autocomplete | Komunikat "wybierz adres z listy" |
| 25 | Nawigacja wstecz | Krok 2 → "wstecz" | Dane z kroku 1 zachowane |
| 26 | Opuszczenie i powrót | Krok 2 → zamknij przeglądarkę → otwórz `/register` | localStorage pamięta stan |
| 27 | Duplikat nazwy | Dwie palarnie "Test Duplicate" | Błąd serwera z jasnym komunikatem |
| 28 | Wiele certyfikatów | Zaznacz 5+ certyfikatów | UI stabilne, scroll działa |
| 29 | Niestandardowe godziny | Pon 08:00-20:00, Wt zamknięte, Sob 10:00-16:00 | Godziny zapisane poprawnie |

### 3B: Rejestracja kawiarni (wizard `/register/cafe`)

| # | Scenariusz | Kroki | Kryterium |
|---|-----------|-------|-----------|
| 30 | Happy path | `tester-cafe` → `/register/cafe` → krok 1 → krok 2 (services, opening hours) → krok 3 → submit | Kawiarnia PENDING |
| 31 | Brak services | Krok 2 → nie zaznacz nic → próbuj dalej | Komunikat "wybierz co najmniej jedną usługę" |
| 32 | Rejestracja bez logowania | Niezalogowany → `/register` → wypełnij krok 1 → submit | Przekierowanie do sign-in, dane NIE przepadły |
| 33 | `/suggest/cafe` bez logowania | Niezalogowany → `/suggest/cafe` → formularz → submit | Działa bez logowania |

### 3C: Edycja przez właściciela (dashboard)

| # | Scenariusz | Kroki | Kryterium |
|---|-----------|-------|-----------|
| 34 | Edycja profilu palarni | `tester-roaster` → `/dashboard/roaster` → zmień opis | Zapisane, revalidacja slug |
| 35 | Edycja zdjęcia głównego | Dashboard → upload przez Uploadthing | Zdjęcie zastąpione |
| 36 | Nieuprawniony dostęp | `tester` (bez roli) → `/dashboard/roaster` | Komunikat "nie masz palarni" |

**Oceniane aspekty:**
- Czy walidacja działa po stronie klienta i serwera
- Czy komunikaty błędów są w języku użytkownika
- Czy wizard zapamiętuje stan między sesjami
- Czy rejestracja bez logowania nie traci danych
- Czy dashboard właściciela jest intuicyjny

---

## Sekcja 4: Dodawanie zdjęć i limity

### 4A: Upload zdjęć przez użytkownika

| # | Scenariusz | Kroki | Kryterium |
|---|-----------|-------|-----------|
| 37 | Happy path — palarnia | `tester` → profil → "Add photo" → Uploadthing → plik <4MB | Zdjęcie PENDING, komunikat o moderacji |
| 38 | Happy path — kawiarnia | To samo dla kawiarni | Działa identycznie |
| 39 | Przekroczenie rozmiaru | Plik >4MB | Uploadthing odrzuca, czytelny komunikat |
| 40 | Nieprawidłowy format | Plik `.txt` / `.pdf` | Odrzucone z komunikatem o formatach |
| 41 | Upload bez logowania | Niezalogowany → "Add photo" | Sign-in modal, powrót do uploadu po zalogowaniu |

### 4B: Limity zdjęć (domyślnie: maxTotal=10, maxPerUser=1)

| # | Scenariusz | Kroki | Kryterium |
|---|-----------|-------|-----------|
| 42 | Limit per-user | `tester` → drugie zdjęcie do TEJ SAMEJ palarni | Akcja odrzucona, komunikat |
| 43 | Inna palarnia OK | Po #42 → zdjęcie do INNEJ palarni | Działa, limit per-entity |
| 44 | Limit total | Admin ustawia maxTotal=3 → dodawaj aż do 4. | Ostatnia próba odrzucona |
| 45 | Odrzucone zdjęcia a limit | Dodaj → admin odrzuca → dodaj kolejne | Odrzucone NIE blokują limitu |
| 46 | Zmiana limitów przez admina | `/admin/settings` → maxTotal=20 | Nowe ustawienia działają |
| 47 | defaultPoolMax | Admin próbuje dodać 21. default image | Odrzucone |

### 4C: UX przy wielu zdjęciach

| # | Scenariusz | Kroki | Kryterium |
|---|-----------|-------|-----------|
| 48 | Galeria 5+ zdjęć | Profil z 5 zdjęciami → przeglądaj | Siatka czytelna, scroll działa |
| 49 | Lightbox — nawigacja | Otwórz → przewijaj strzałkami | Płynna animacja, ładowanie zdjęć |
| 50 | Lightbox — zamknięcie | X / kliknij tło / Esc | Zamyka się każdą metodą |
| 51 | Primary vs reszta | 3 zdjęcia → primary wyraźnie wyróżnione | Wizualna różnica |
| 52 | Mobile 375px | Profil z 5 zdjęciami na mobile | Responsywna galeria |
| 53 | Sortowanie zdjęć | Dashboard → przeciągnij | Kolejność zapisana |

### 4D: Moderacja zdjęć (admin)

| # | Scenariusz | Kroki | Kryterium |
|---|-----------|-------|-----------|
| 54 | Approve zdjęcia | `/admin/images/pending` → approve | APPROVED, widoczne publicznie |
| 55 | Reject z powodem | Reject → wpisz powód | REJECTED, user widzi powód? |
| 56 | Mass approve/reject | Zaznacz 3 → akcja zbiorcza | Wszystkie zmieniają status |

**Oceniane aspekty:**
- Czy limity komunikowane PROAKTYWNIE (przed uploadem), czy dopiero po błędzie
- Czy komunikaty limitów są w języku użytkownika
- Czy lightbox i galeria płynne przy 10+ zdjęciach
- Czy na mobile galeria nie psuje układu
- Czy odrzucone zdjęcia nie blokują miejsca

---

## Sekcja 5: Dodawanie komentarzy i recenzji

### 5A: Dodawanie recenzji

| # | Scenariusz | Kroki | Kryterium |
|---|-----------|-------|-----------|
| 57 | Happy path — palarnia | `tester` → profil → wypełnij ReviewForm (imię, 4★, komentarz 50+ znaków) → submit | Recenzja PENDING, komunikat o moderacji |
| 58 | Happy path — kawiarnia | To samo dla kawiarni | Działa identycznie |
| 59 | Za krótki komentarz | "ok" (2 znaki) | Czerwony komunikat pod polem |
| 60 | Brak gwiazdek | Nie kliknij | Komunikat "wybierz ocenę" |
| 61 | Puste imię | Zostaw puste | Komunikat "imię jest wymagane" |
| 62 | Recenzja bez logowania | Niezalogowany → wypełnij form → submit | `<SignInButton>` — czy dane przepadły po login? |
| 63 | Duplikat recenzji | Druga recenzja tej samej palarni | Odrzucone, komunikat "już zrecenzowałeś" |
| 64 | Maksymalna długość | 2000+ znaków | Odcięcie lub błąd walidacji |
| 65 | Średnia z różnych ocen | Kilka recenzji 1★ i 5★ | Średnia poprawnie przeliczona |

### 5B: Wyświetlanie recenzji

| # | Scenariusz | Kroki | Kryterium |
|---|-----------|-------|-----------|
| 66 | Sortowanie | 5+ recenzji → zmień sortowanie | Lista się sortuje |
| 67 | PENDING — NIE widoczne | Dodaj recenzję → sprawdź profil jako inny user | Nie widać |
| 68 | Pusta lista | Profil bez recenzji | Placeholder "bądź pierwszy" |
| 69 | Imię recenzenta | Wyświetla imię z formularza | Nie email |

### 5C: Moderacja recenzji (admin)

| # | Scenariusz | Kroki | Kryterium |
|---|-----------|-------|-----------|
| 70 | Approve | `/admin/reviews` → approve | APPROVED, widoczne, średnia zaktualizowana |
| 71 | Reject | Reject | REJECTED, nie widoczne |
| 72 | Filtry statusów | PENDING / APPROVED / REJECTED | Filtry działają |

**Oceniane aspekty:**
- Czy recenzje bez logowania prowadzą do utraty danych w formularzu
- Czy walidacja jest czytelna (inline błędy)
- Czy duplikaty obsłużone zrozumiałym komunikatem
- Czy pusta lista recenzji ma sensowny placeholder
- Czy średnia ocen aktualizuje się po approve/reject

---

## Format dokumentacji wyników

Po wykonaniu wszystkich scenariuszy, każdy problem będzie opisany w formacie:

```markdown
### Problem #N: [Krótki tytuł]
- **Scenariusz:** #[numer]
- **Obszar:** [Wyszukiwanie / Dodawanie / Zdjęcia / Recenzje]
- **Priorytet:** [P0 blokujący / P1 wysoki / P2 średni / P3 niski]
- **Severity:** [Krytyczny / Poważny / Kosmetyczny]

**Obserwacja:** Co dokładnie się stało, krok po kroku.

**Oczekiwane zachowanie:** Jak powinno działać.

**Rekomendacja techniczna:**
- Pliki do zmiany: `...`
- Proponowane rozwiązanie: komponent / server action / zmiana layoutu
- Szacowana złożoność: [mała / średnia / duża]
```

Zbiorczo w pliku `.tmp/usability-report-2026-05-09.md`.

---

## Kolejność wykonania

1. ✅ Design zatwierdzony (ten dokument)
2. Stworzenie seeda kont testowych (`prisma/seed_test_users.ts`)
3. Uruchomienie seeda — weryfikacja 4 kont
4. Wykonanie scenariuszy #1-#72 w 5 obszarach
5. Dokumentacja problemów w `.tmp/usability-report-2026-05-09.md`
6. Rekomendacje techniczne dla każdego problemu
7. Opcjonalnie: propozycje nowych komponentów / layoutów
