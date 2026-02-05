# Walkthrough: Reverse Exchange, Auto-Detection, and UI Refinement

## Summary
Transforming the app into a dual-direction calculator suitable for both Locals and Foreigners. We added Reverse Exchange (KRW Input -> Foreign Output), Automatic Nationality Detection, and completely separated the UI/Logic for selecting "Target Currency" to prevent confusion.

## Key Features Added

### 1. Reverse Exchange (Foreigner Mode)
- **Input KRW**: Users can now select South Korean Won (KRW) as the input currency.
- **Dynamic Target**: If input is KRW, the result automatically shows the user's "Home Currency" (e.g., USD, JPY).
- **Core Formula**: `InputAmount * (SourceRate / TargetRate)`.

### 2. Robust Auto-Detection
- **Smart Logic**: Detects location/timezone to set the **Local Currency** (Source) source automatically.
- **Respects Preference**: Crucially, if you have set your "Home Currency" (Target), moving to a new timezone (e.g., Paris) will update the Local Currency (EUR) but **keep** your Home Currency (e.g., USD) intact. It no longer overwrites it.
- **Refresh Protection**: Clicking "Refresh Rate" now correctly maintains your Target Currency setting instead of resetting it to match the local currency, **even when the data comes from the cache (popup alert)**.

### 3. Separate "Embedded" Target Search UI
- **Issue**: Standard menus felt disconnected from the result area.
- **Solution**: Implemented an **Embedded Search Overlay** inside the Result Box.
- **UX**: When you tap the result, the box itself transforms into a search list. No jumping menus, no confusion with the "Local Currency" selector.
- **Strict Isolation**: Changing the "Result Currency" never affects the "Source Currency".

### 4. Exchange Rate Display
- **Visual Confirmation**: The exact applied exchange rate is now displayed below the result (e.g., `1 USD = 1,423.50 KRW`).
- **Context Aware**: Automatically adjusts for currencies like JPY/VND to show rate per 100 units (e.g., `100 JPY = 933.24 KRW`).
