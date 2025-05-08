import * as React from 'react'
import { DialogContent } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { Row } from '../../ui/lib/row'
import { Select } from '../lib/select'
import { Shell, parse as parseShell } from '../../lib/shells'
import { suggestedExternalEditor } from '../../lib/editors/shared'
import { CustomIntegrationForm } from './custom-integration-form'
import { ICustomIntegration } from '../../lib/custom-integration'
import { enableCustomIntegration } from '../../lib/feature-flag'

const CustomIntegrationValue = 'other'

interface IIntegrationsPreferencesProps {
  readonly availableEditors: ReadonlyArray<string>
  readonly selectedExternalEditor: string | null
  readonly selectedSecondaryExternalEditor: string | null
  readonly availableShells: ReadonlyArray<Shell>
  readonly selectedShell: Shell
  readonly useCustomEditor: boolean
  readonly customEditor: ICustomIntegration
  readonly useCustomSecondaryEditor: boolean
  readonly customSecondaryEditor: ICustomIntegration | null
  readonly useCustomShell: boolean
  readonly customShell: ICustomIntegration
  readonly onSelectedEditorChanged: (editor: string) => void
  readonly onSelectedSecondaryEditorChanged: (editor: string | null) => void
  readonly onSelectedShellChanged: (shell: Shell) => void
  readonly onUseCustomEditorChanged: (useCustomEditor: boolean) => void
  readonly onCustomEditorChanged: (customEditor: ICustomIntegration) => void
  readonly onUseCustomSecondaryEditorChanged: (
    useCustomSecondaryEditor: boolean
  ) => void
  readonly onCustomSecondaryEditorChanged: (
    customSecondaryEditor: ICustomIntegration
  ) => void
  readonly onUseCustomShellChanged: (useCustomShell: boolean) => void
  readonly onCustomShellChanged: (customShell: ICustomIntegration) => void
}

interface IIntegrationsPreferencesState {
  readonly selectedExternalEditor: string | null
  readonly selectedSecondaryExternalEditor: string | null
  readonly selectedShell: Shell
  readonly useCustomEditor: boolean
  readonly useCustomSecondaryEditor: boolean
  readonly customEditor: ICustomIntegration
  readonly customSecondaryEditor: ICustomIntegration
  readonly useCustomShell: boolean
  readonly customShell: ICustomIntegration
}

export class Integrations extends React.Component<
  IIntegrationsPreferencesProps,
  IIntegrationsPreferencesState
> {
  private customEditorFormRef = React.createRef<CustomIntegrationForm>()
  private customSecondaryEditorFormRef =
    React.createRef<CustomIntegrationForm>()
  private customShellFormRef = React.createRef<CustomIntegrationForm>()

  public constructor(props: IIntegrationsPreferencesProps) {
    super(props)

    this.state = {
      selectedExternalEditor: this.props.selectedExternalEditor,
      selectedSecondaryExternalEditor:
        this.props.selectedSecondaryExternalEditor,
      selectedShell: this.props.selectedShell,
      useCustomEditor: this.props.useCustomEditor,
      useCustomSecondaryEditor: this.props.useCustomSecondaryEditor,
      customEditor: this.props.customEditor,
      customSecondaryEditor: this.props.customSecondaryEditor ?? {
        path: '',
        arguments: '',
      },
      useCustomShell: this.props.useCustomShell,
      customShell: this.props.customShell,
    }
  }

  public async componentWillReceiveProps(
    nextProps: IIntegrationsPreferencesProps
  ) {
    const editors = nextProps.availableEditors
    let selectedExternalEditor = nextProps.selectedExternalEditor
    if (editors.length) {
      const indexOf = selectedExternalEditor
        ? editors.indexOf(selectedExternalEditor)
        : -1
      if (indexOf === -1) {
        selectedExternalEditor = editors[0]
        nextProps.onSelectedEditorChanged(selectedExternalEditor)
      }
    }

    let selectedSecondaryExternalEditor =
      nextProps.selectedSecondaryExternalEditor
    if (editors.length) {
      const indexOf = selectedSecondaryExternalEditor
        ? editors.indexOf(selectedSecondaryExternalEditor)
        : -1
      if (indexOf === -1 && selectedSecondaryExternalEditor !== null) {
        // Only default if it's not explicitly set to null (meaning no editor selected)
        // And there are available editors to choose from
        selectedSecondaryExternalEditor = editors[0]
        nextProps.onSelectedSecondaryEditorChanged(
          selectedSecondaryExternalEditor
        )
      }
    }

    const shells = nextProps.availableShells
    let selectedShell = nextProps.selectedShell
    if (shells.length) {
      const indexOf = shells.indexOf(selectedShell)
      if (indexOf === -1) {
        selectedShell = shells[0]
        nextProps.onSelectedShellChanged(selectedShell)
      }
    }
    this.setState({
      selectedExternalEditor,
      selectedSecondaryExternalEditor,
      selectedShell,
      useCustomEditor: nextProps.useCustomEditor,
      customEditor: nextProps.customEditor,
      useCustomSecondaryEditor: nextProps.useCustomSecondaryEditor,
      customSecondaryEditor: nextProps.customSecondaryEditor ?? {
        path: '',
        arguments: '',
      },
      useCustomShell: nextProps.useCustomShell,
      customShell: nextProps.customShell,
    })
  }

  public componentDidMount(): void {
    if (enableCustomIntegration()) {
      const {
        availableEditors,
        availableShells,
        useCustomEditor,
        useCustomShell,
      } = this.props

      // When there are no available editors or shells, the `Select` component
      // will have the custom editor or shell already selected, but we need
      // to handle that as initial value, otherwise the custom integration
      // form won't be rendered.

      if (availableEditors.length === 0 && !useCustomEditor) {
        this.setSelectedEditor(CustomIntegrationValue)
      }

      if (availableShells.length === 0 && !useCustomShell) {
        this.setSelectedShell(CustomIntegrationValue)
      }
    }
  }

  public componentDidUpdate(
    prevProps: IIntegrationsPreferencesProps,
    prevState: IIntegrationsPreferencesState
  ): void {
    // When the user switches to the custom editor or shell, we want to focus the
    // path input field.
    if (!prevState.useCustomEditor && this.state.useCustomEditor) {
      this.customEditorFormRef.current?.focus()
    }

    if (
      !prevState.useCustomSecondaryEditor &&
      this.state.useCustomSecondaryEditor
    ) {
      this.customSecondaryEditorFormRef.current?.focus()
    }

    if (!prevState.useCustomShell && this.state.useCustomShell) {
      this.customShellFormRef.current?.focus()
    }
  }

  private onSelectedEditorChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const value = event.currentTarget.value
    if (!value) {
      return
    }

    this.setSelectedEditor(value)
  }

  private setSelectedEditor = (editor: string) => {
    if (editor === CustomIntegrationValue) {
      this.setState({ useCustomEditor: true })
      this.props.onUseCustomEditorChanged(true)
    } else {
      this.setState({
        useCustomEditor: false,
        selectedExternalEditor: editor,
      })
      this.props.onUseCustomEditorChanged(false)
      this.props.onSelectedEditorChanged(editor)
    }
  }

  private onSelectedSecondaryEditorChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const value = event.currentTarget.value
    if (!value) {
      return
    }
    this.setSelectedSecondaryEditor(value)
  }

  private setSelectedSecondaryEditor = (editor: string) => {
    console.log('EDITOR - setSelectedSecondaryEditor', editor)
    if (editor === CustomIntegrationValue) {
      this.setState({ useCustomSecondaryEditor: true })
      this.props.onUseCustomSecondaryEditorChanged(true)
    } else if (editor === '') {
      this.setState({
        useCustomSecondaryEditor: false,
        selectedSecondaryExternalEditor: null,
      })
      this.props.onUseCustomSecondaryEditorChanged(false)
      this.props.onSelectedSecondaryEditorChanged(null)
    } else {
      this.setState({
        useCustomSecondaryEditor: false,
        selectedSecondaryExternalEditor: editor,
      })
      this.props.onUseCustomSecondaryEditorChanged(false)
      this.props.onSelectedSecondaryEditorChanged(editor)
    }
  }

  private onSelectedShellChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const value = event.currentTarget.value
    if (!value) {
      return
    }

    this.setSelectedShell(value)
  }

  private setSelectedShell = (shell: string) => {
    if (shell === CustomIntegrationValue) {
      this.setState({ useCustomShell: true })
      this.props.onUseCustomShellChanged(true)
    } else {
      const parsedValue = parseShell(shell)
      this.setState({
        useCustomShell: false,
        selectedShell: parsedValue,
      })
      this.props.onSelectedShellChanged(parsedValue)
      this.props.onUseCustomShellChanged(false)
    }
  }

  private renderExternalEditor() {
    const options = this.props.availableEditors
    const { selectedExternalEditor, useCustomEditor } = this.state
    const label = __DARWIN__ ? 'External Editor' : 'External editor'

    if (!enableCustomIntegration() && options.length === 0) {
      // this is emulating the <Select/> component's UI so the styles are
      // consistent for either case.
      //
      // TODO: see whether it makes sense to have a fallback UI
      // which we display when the select list is empty
      return (
        <div className="select-component no-options-found">
          <label>{label}</label>
          <span>
            No editors found.{' '}
            <LinkButton uri={suggestedExternalEditor.url}>
              Install {suggestedExternalEditor.name}?
            </LinkButton>
          </span>
        </div>
      )
    }

    return (
      <Select
        label={enableCustomIntegration() ? undefined : label}
        aria-label="External editor"
        value={
          useCustomEditor
            ? CustomIntegrationValue
            : selectedExternalEditor ?? undefined
        }
        onChange={this.onSelectedEditorChanged}
      >
        {options.map(n => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
        {enableCustomIntegration() && (
          <option key={CustomIntegrationValue} value={CustomIntegrationValue}>
            {__DARWIN__
              ? 'Configure Custom Editor…'
              : 'Configure custom editor…'}
          </option>
        )}
      </Select>
    )
  }

  private renderSecondaryExternalEditor() {
    const options = this.props.availableEditors
    const { selectedSecondaryExternalEditor, useCustomSecondaryEditor } =
      this.state
    const label = __DARWIN__
      ? 'Secondary External Editor'
      : 'Secondary external editor'

    // Unlike the primary editor, we don't show a "No editors found" message here,
    // as it's an optional feature. The Select component will be empty or show available.

    return (
      <Select
        label={enableCustomIntegration() ? undefined : label}
        aria-label="Secondary external editor"
        value={
          useCustomSecondaryEditor
            ? CustomIntegrationValue
            : selectedSecondaryExternalEditor ?? undefined
        }
        onChange={this.onSelectedSecondaryEditorChanged}
      >
        {/* Allow a "None" option */}
        <option key="none" value="">
          None
        </option>
        {options.map(n => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
        {enableCustomIntegration() && (
          <option key={CustomIntegrationValue} value={CustomIntegrationValue}>
            {__DARWIN__
              ? 'Configure Custom Secondary Editor…'
              : 'Configure custom secondary editor…'}
          </option>
        )}
      </Select>
    )
  }

  private renderNoExternalEditorHint() {
    const options = this.props.availableEditors
    if (options.length > 0) {
      return null
    }

    return (
      <Row>
        <div className="no-options-found">
          <span>
            No other editors found.{' '}
            <LinkButton uri={suggestedExternalEditor.url}>
              Install {suggestedExternalEditor.name}?
            </LinkButton>
          </span>
        </div>
      </Row>
    )
  }

  private renderCustomExternalEditor() {
    return (
      <Row>
        <CustomIntegrationForm
          id="custom-editor"
          ref={this.customEditorFormRef}
          path={this.state.customEditor.path ?? ''}
          arguments={this.state.customEditor.arguments}
          onPathChanged={this.onCustomEditorPathChanged}
          onArgumentsChanged={this.onCustomEditorArgumentsChanged}
        />
      </Row>
    )
  }

  private renderCustomSecondaryExternalEditor() {
    return (
      <Row>
        <CustomIntegrationForm
          id="custom-secondary-editor"
          ref={this.customSecondaryEditorFormRef}
          path={this.state.customSecondaryEditor.path ?? ''}
          arguments={this.state.customSecondaryEditor.arguments}
          onPathChanged={this.onCustomSecondaryEditorPathChanged}
          onArgumentsChanged={this.onCustomSecondaryEditorArgumentsChanged}
        />
      </Row>
    )
  }

  private onCustomEditorPathChanged = (path: string, bundleID?: string) => {
    const customEditor: ICustomIntegration = {
      path,
      bundleID,
      arguments: this.state.customEditor.arguments ?? [],
    }

    this.setState({ customEditor })
    this.props.onCustomEditorChanged(customEditor)
  }

  private onCustomEditorArgumentsChanged = (args: string) => {
    const customEditor: ICustomIntegration = {
      path: this.state.customEditor.path,
      bundleID: this.state.customEditor.bundleID,
      arguments: args,
    }

    this.setState({ customEditor })
    this.props.onCustomEditorChanged(customEditor)
  }

  private onCustomSecondaryEditorPathChanged = (
    path: string,
    bundleID?: string
  ) => {
    const customSecondaryEditor: ICustomIntegration = {
      path,
      bundleID,
      arguments: this.state.customSecondaryEditor.arguments ?? [],
    }

    this.setState({ customSecondaryEditor })
    this.props.onCustomSecondaryEditorChanged(customSecondaryEditor)
  }

  private onCustomSecondaryEditorArgumentsChanged = (args: string) => {
    const customSecondaryEditor: ICustomIntegration = {
      path: this.state.customSecondaryEditor.path,
      bundleID: this.state.customSecondaryEditor.bundleID,
      arguments: args,
    }

    this.setState({ customSecondaryEditor })
    this.props.onCustomSecondaryEditorChanged(customSecondaryEditor)
  }

  private renderSelectedShell() {
    const options = this.props.availableShells
    const { selectedShell, useCustomShell } = this.state

    return (
      <Select
        label={enableCustomIntegration() ? undefined : 'Shell'}
        aria-label="Shell"
        value={useCustomShell ? CustomIntegrationValue : selectedShell}
        onChange={this.onSelectedShellChanged}
      >
        {options.map(n => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
        {enableCustomIntegration() && (
          <option key={CustomIntegrationValue} value={CustomIntegrationValue}>
            {__DARWIN__ ? 'Configure Custom Shell…' : 'Configure custom shell…'}
          </option>
        )}
      </Select>
    )
  }

  private renderCustomShell() {
    return (
      <Row>
        <CustomIntegrationForm
          id="custom-shell"
          ref={this.customShellFormRef}
          path={this.state.customShell.path}
          arguments={this.state.customShell.arguments}
          onPathChanged={this.onCustomShellPathChanged}
          onArgumentsChanged={this.onCustomShellArgumentsChanged}
        />
      </Row>
    )
  }

  private onCustomShellPathChanged = (path: string, bundleID?: string) => {
    const customShell: ICustomIntegration = {
      path,
      bundleID,
      arguments: this.state.customShell.arguments ?? [],
    }

    this.setState({ customShell })
    this.props.onCustomShellChanged(customShell)
  }

  private onCustomShellArgumentsChanged = (args: string) => {
    const customShell: ICustomIntegration = {
      path: this.state.customShell.path ?? '',
      bundleID: this.state.customShell.bundleID,
      arguments: args,
    }

    this.setState({ customShell })
    this.props.onCustomShellChanged(customShell)
  }

  public render() {
    if (!enableCustomIntegration()) {
      return (
        <DialogContent>
          <h2>Applications</h2>
          <Row>{this.renderExternalEditor()}</Row>
          <Row>{this.renderSecondaryExternalEditor()}</Row>
          <Row>{this.renderSelectedShell()}</Row>
        </DialogContent>
      )
    }

    return (
      <DialogContent>
        <fieldset>
          <legend>
            <h2>{__DARWIN__ ? 'External Editor' : 'External editor'}</h2>
          </legend>
          <Row>{this.renderExternalEditor()}</Row>
          {this.state.useCustomEditor && this.renderCustomExternalEditor()}
          {this.renderNoExternalEditorHint()}
        </fieldset>
        <fieldset>
          <legend>
            <h2>
              {__DARWIN__
                ? 'Secondary External Editor'
                : 'Secondary external editor'}
            </h2>
          </legend>
          <Row>{this.renderSecondaryExternalEditor()}</Row>
          {this.state.useCustomSecondaryEditor &&
            this.renderCustomSecondaryExternalEditor()}
        </fieldset>
        <fieldset>
          <legend>
            <h2>Shell</h2>
          </legend>
          <Row>{this.renderSelectedShell()}</Row>
          {this.state.useCustomShell && this.renderCustomShell()}
        </fieldset>
      </DialogContent>
    )
  }
}
