# Plan & Likely File Candidates

**Overall Goal:** Add a secondary external editor feature to GitHub Desktop. This includes:

1. Allowing users to configure a secondary editor in Preferences.
2. Providing a button/option in the UI to open the current repository in this secondary editor.
3. Adding a keyboard shortcut for this action.

**Progress & Refined Plan:**

Some initial work has been done, primarily in `app-store.ts`, `app-state.ts`, and `menu-labels.ts` to define state variables for the secondary editor.

1. **Data Model & Store (`app-store.ts`, `app-state.ts`) (Partially Done):**
    * **Current Status:** Fields like `selectedSecondaryExternalEditor`, `resolvedSecondaryExternalEditor`, `useSecondaryCustomEditor`, and `secondaryCustomEditor` exist in `IAppState` (`app-state.ts`). `loadInitialState` in `app-store.ts` loads preferences for these. Methods for looking up and resolving the secondary editor (`lookupSelectedSecondaryExternalEditor`, `_resolveCurrentSecondaryExternalEditor`, etc.) are also present. `MenuLabelsEvent` includes `selectedSecondaryExternalEditor`.
    * **Next Steps / Verification:**
        * **Saving Preferences:** Ensure that `app-store.ts` has, or is updated with, methods to *set* the secondary custom editor preferences (e.g., `_setUseSecondaryCustomEditor`, `_setSecondaryCustomEditor`). These will be called when the user saves their choices in the Preferences dialog.
        * **Menu Labels:** Verify that `updateMenuItemLabels` in `app-store.ts` correctly passes the `selectedSecondaryExternalEditor` name to `updatePreferredAppMenuItemLabels` so it can be displayed in the main application menu.

2. **Settings UI (`app/src/ui/preferences/preferences.tsx` and `app/src/ui/preferences/integrations.tsx`):**
    * **`app/src/ui/preferences/preferences.tsx`:**
        * Update `IPreferencesProps` to include props for secondary editor settings (e.g., `selectedSecondaryExternalEditor`, `useSecondaryCustomEditor`, `customSecondaryEditor`, and their corresponding `onChanged` handlers).
        * Update `IPreferencesState` to hold these values.
        * Modify `componentWillMount` (or constructor/`componentDidMount`) to initialize this state from the props passed by `AppStore`.
        * Pass these new props and handlers to the `<Integrations />` component.
        * Update the `onSave` method to call new dispatcher actions for saving the secondary editor's preferences (e.g., `dispatcher.setSecondaryExternalEditor(...)`, `dispatcher.setUseSecondaryCustomEditor(...)`, `dispatcher.setSecondaryCustomEditor(...)`).
    * **`app/src/ui/preferences/integrations.tsx`:**
        * Add the new props to `IIntegrationsPreferencesProps` (for selected editor, custom editor details, and their change handlers).
        * Add corresponding state fields to `IIntegrationsPreferencesState`.
        * In the `render` method, duplicate the `GroupBox` used for the primary "External editor" to create a new section for "Secondary External Editor". This includes the dropdown for detected editors and the `CustomIntegrationForm` for custom paths/arguments.
        * Implement new event handlers (e.g., `onSelectedSecondaryEditorChanged`, `onUseSecondaryCustomEditorChanged`, `onCustomSecondaryEditorChanged`) and wire them to the new UI elements.

3. **Editor Launching Logic (`app/src/lib/stores/app-store.ts`):**
    * Create a new method: `_openInSecondaryExternalEditor(fullPath: string)`.
    * This method will be very similar to `_openInExternalEditor` but will use `this.selectedSecondaryExternalEditor`, `this.useSecondaryCustomEditor`, and `this.secondaryCustomEditor` (or access them via `this.getState()`).
    * It will reuse existing utility functions like `findEditorOrDefault`, `launchCustomExternalEditor`, and `launchExternalEditor`.

4. **Main UI Button/Action (e.g., in `app/src/ui/changes/no-changes.tsx` or `app/src/ui/toolbar/toolbar.tsx`):**
    * **Consider `app/src/ui/changes/no-changes.tsx` (for the "no changes" screen actions):**
        * Add a prop like `isSecondaryExternalEditorAvailable: boolean` to `INoChangesProps`.
        * Add a new method `renderOpenInSecondaryExternalEditor` (similar to `renderOpenInExternalEditor`) to the `NoChanges` class.
        * This method should render a `SuggestedAction` button (or similar UI element).
        * The button's `onClick` should trigger a new dispatcher action, e.g., `this.props.dispatcher.openRepositoryInSecondaryEditor(this.props.repository.path)`.
        * Disable the button if `isSecondaryExternalEditorAvailable` is false.
    * **Alternative: Toolbar button in `app/src/ui/toolbar/toolbar.tsx` or `app/src/ui/repository.tsx`:**
        * Add a new button visually similar to the primary "Open in..." button.
        * Its `onClick` handler would also dispatch the `openRepositoryInSecondaryEditor` action.
    * **Dispatcher (`app/src/ui/dispatcher/dispatcher.ts`):**
        * Add the new `openRepositoryInSecondaryEditor(path: string)` action.
        * This action will call `appStore._openInSecondaryExternalEditor(path)`.

5. **Keybinding (`app/src/main-process/menu/build-default-menu.ts`):**
    * **`MenuLabelsEvent`**: This type in `app/src/models/menu-labels.ts` already includes `selectedSecondaryExternalEditor`.
    * **`buildDefaultMenu` function (in `app/src/main-process/menu/build-default-menu.ts`):**
        * Ensure its signature destructures `selectedSecondaryExternalEditor` from the `MenuLabelsEvent` argument.
        * Add a new menu item, likely under "Repository" or near the existing "Open in {Editor}" item.
        * `label`: Make it dynamic, e.g., `Open in ${selectedSecondaryExternalEditorName || 'Secondary Editor'}`. The name would come from `selectedSecondaryExternalEditor`.
        * `accelerator: 'CommandOrControl+Shift+S'`. (Verify this shortcut is not already in use by carefully checking all other accelerators defined in `build-default-menu.ts`). `Ctrl+Shift+Q` is often a quit-related shortcut.
        * `enabled`: Set based on whether `selectedSecondaryExternalEditor` (or its resolved version from `AppStore`) is available.
        * `click`: The handler should call `emit('open-in-secondary-editor')` or a similar new, specific menu event.
    * **IPC Handling:**
        * Define the new menu event string (e.g., `open-in-secondary-editor`) in a shared place like `app/src/models/menu-ids.ts` or `app/src/lib/menu-ipc.ts`.
        * The `AppStore` needs to listen for this event (likely in its `onMenuEvent` handler or wherever it processes IPC messages from the main process for menu actions) and then call `this._openInSecondaryExternalEditor(this.selectedRepository.path)` (if a repository is selected).

**Key Files Revisited (with focus areas for secondary editor):**

* `app/src/lib/stores/app-store.ts`: Core logic for state management, editor launching, preference saving/loading for secondary editor.
* `app/src/ui/preferences/preferences.tsx`: Propagate secondary editor state/handlers to `Integrations` tab. Save preferences.
* `app/src/ui/preferences/integrations.tsx`: UI for selecting/configuring the secondary editor.
* `app/src/ui/changes/no-changes.tsx` (or other main UI view): Button to trigger opening in secondary editor.
* `app/src/main-process/menu/build-default-menu.ts`: Define menu item and keyboard shortcut.
* `app/src/ui/dispatcher/dispatcher.ts`: New actions for opening in secondary editor and saving its preferences.
* `app/src/lib/app-state.ts`: Ensure `IAppState` correctly reflects all secondary editor fields.
* `app/src/models/menu-labels.ts`: Ensure `MenuLabelsEvent` is up-to-date for menu display.
* `app/src/models/preferences.ts`: (Currently minimal) If actual preference fields were to be modeled here, they'd be added.

**General Tips:**

* Reuse existing patterns from the primary external editor feature.
* Pay close attention to TypeScript types.
* Use IDE search for related terms ("externalEditor", "shell", editor names) to find relevant code sections.
* Verify shortcut availability directly in `build-default-menu.ts`.
