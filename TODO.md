# Plan & Likely File Candidates

**Overall Goal:** Add a secondary external editor feature to GitHub Desktop. This includes:

1. Allowing users to configure a secondary editor in Preferences.
2. Providing a button/option in the UI to open the current repository in this secondary editor.
3. Adding a keyboard shortcut for this action.

**IMPORTANT**:

- It's CustomSecondaryEditor, NOT SecondaryCustomEditor
- It's SecondaryExternalEditor, NOT ExternalSecondaryEditor

**Progress & Refined Plan:**

Some initial work has been done, primarily in `app-store.ts`, `app-state.ts`, and `menu-labels.ts` to define state variables for the secondary editor.

1. **Data Model & Store (`app-store.ts`, `app-state.ts`) (DONE):**
    - **Status:** Fields exist in `IAppState`. Loading/resolving methods exist in `AppStore`. Methods for saving selected *and* custom secondary editor preferences (`_setSecondaryExternalEditor`, `_setUseCustomSecondaryEditor`, `_setCustomSecondaryEditor`) exist in `AppStore`.
    - **Next Steps / Verification:**
        - **Menu Labels:** Verify later that `updateMenuItemLabels` in `app-store.ts` correctly passes the `selectedSecondaryExternalEditor` name to `updatePreferredAppMenuItemLabels`.

2. **Settings UI (`app/src/ui/preferences/preferences.tsx` and `app/src/ui/preferences/integrations.tsx`):**
    - **`app/src/ui/preferences/preferences.tsx` (DONE):**
        - **Status:** `IPreferencesProps` and `IPreferencesState` updated. State initialized. Props/handlers passed down to `<Integrations />`. `onSave` updated to call dispatcher actions.
    - **`app/src/ui/preferences/integrations.tsx` (DONE):**
        - Add new props to `IIntegrationsPreferencesProps` (incl. `selectedSecondaryExternalEditor`, `useCustomSecondaryEditor`, `customSecondaryEditor`, and handlers).
        - Add corresponding state fields to `IIntegrationsPreferencesState`.
        - Update constructor/`componentWillReceiveProps` to handle new props/state.
        - Duplicate the primary editor's UI (`<fieldset>`, `<Select>`, `<CustomIntegrationForm>`) for the secondary editor.
        - Implement local event handlers (e.g., `onSelectedSecondaryEditorChanged`, `onUseCustomSecondaryEditorChanged`, `onCustomSecondaryEditorChanged`) and connect them to the new UI and the prop handlers passed down from `Preferences`.

3. **Editor Launching Logic (`app/src/lib/stores/app-store.ts`) (DONE):**
    - **Status:** New method `_openInSecondaryExternalEditor` added.

4. **Main UI Button/Action (e.g., in `app/src/ui/changes/no-changes.tsx` or `app/src/ui/toolbar/toolbar.tsx`) (PENDING - UI in no-changes.tsx DONE, Dispatcher/Metric PENDING):**
    - **`app/src/ui/changes/no-changes.tsx` (UI DONE):**
        - Added `isSecondaryExternalEditorAvailable` and `selectedSecondaryExternalEditorName` props to `INoChangesProps`.
        - Implemented `renderOpenInSecondaryExternalEditor()` method for the suggested action button.
        - Added `onOpenInSecondaryExternalEditorClicked` handler to increment a metric (metric name `'suggestedStepOpenInSecondaryExternalEditor'` needs to be defined).
        - The button relies on a menu item ID `'open-secondary-external-editor'` which will trigger the actual editor opening logic via `app.tsx`.
    - **Alternative: Toolbar button:** Add button, connect to dispatcher.
    - **Dispatcher (`app/src/ui/dispatcher/dispatcher.ts`) (PENDING - Needs `openRepositoryInSecondaryEditor` and metric definition):**
        - Add `openRepositoryInSecondaryEditor(repository: Repository)` action (should call `appStore._openInSecondaryExternalEditor`). This is referenced by the menu event handler in `app.tsx`.
        - Define the metric name `'suggestedStepOpenInSecondaryExternalEditor'`.
        - Ensure actions exist for saving secondary editor preferences (`setSecondaryExternalEditor`, `setUseCustomSecondaryEditor`, `setCustomSecondaryEditor`) (User reported done, verify).

5. **Keybinding (`app/src/main-process/menu/build-default-menu.ts`) (PENDING):**
    - **`MenuLabelsEvent`**: Includes `selectedSecondaryExternalEditor`.
    - **`buildDefaultMenu` function:** Ensure signature destructures it. Add menu item (label, accelerator `CmdOrCtrl+Shift+S`?, enabled state, click handler using `emit`).
    - **IPC Handling:** Define menu event. Update `AppStore` listener to call `_openInSecondaryExternalEditor`.

**Key Files Revisited (with focus areas for secondary editor):**

- `app/src/lib/stores/app-store.ts`: (Functionally complete for now)
- `app/src/ui/preferences/preferences.tsx`: (DONE)
- `app/src/ui/preferences/integrations.tsx`: (DONE - UI Implementation)
- `app/src/ui/changes/no-changes.tsx` (or other main UI view): (PENDING - Button/Action)
- `app/src/main-process/menu/build-default-menu.ts`: (PENDING - Menu Item/Shortcut)
- `app/src/ui/dispatcher/dispatcher.ts`: (User reports done - Actions)
- `app/src/lib/app-state.ts`: (DONE)
- `app/src/models/menu-labels.ts`: (DONE)
- `app/src/models/preferences.ts`: (No changes needed currently)
- `app/src/ui/app.tsx`: (PENDING - needs investigation for secondary editor integration)

**General Tips:**

- Reuse existing patterns from the primary external editor feature.
- Pay close attention to TypeScript types.
- Use IDE search for related terms ("externalEditor", "shell", editor names) to find relevant code sections.
- Verify shortcut availability directly in `build-default-menu.ts`.
