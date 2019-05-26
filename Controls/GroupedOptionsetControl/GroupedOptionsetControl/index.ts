import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as Materilize from 'materialize-css';


export class GroupedOptionset implements ComponentFramework.StandardControl<IInputs, IOutputs> {

	// Value of the field is stored and used inside the control 
	private _value: number;

	// PCF framework delegate which will be assigned to this object which would be called whenever any update happens. 
	private _notifyOutputChanged: () => void;

	// Reference to the control container HTMLDivElement
	// This element contains all elements of our custom control example
	private _container: HTMLDivElement;

    // select container 
	private _selectContainer: HTMLSelectElement;

	// Reference to ComponentFramework Context object
	private _context: ComponentFramework.Context<IInputs>;

	// Hold field options of bounded optionset field
	private _fieldOptions: Array<ComponentFramework.PropertyHelper.OptionMetadata>;

	// Event listener for materialize select onOpenStart event.
	private _onDropdownOpenStart: EventListener;

	// Event listener for materialize select onOpenStart event.
	private _onDropdownOpenEnd: EventListener;

	// Holds dropdown instance object after intialization of materilize plugin on select container.
	private _dropdownInstance: M.FormSelect;

	/**
	 * Empty constructor.
	 */
	constructor() {

	}

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='starndard', it will receive an empty div element within which it can render its content.
	 */
	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement) {
		// Add control initialization code

		this._context = context;
		console.log(this._context.parameters);
		this._notifyOutputChanged = notifyOutputChanged;
		// Validate and parse the given configuration Json string input property "groupingOptions".
		if (this._context.parameters.groupingOptions) {
			let optionsString = this._context.parameters.groupingOptions.raw;
			let groupedOptions = JSON.parse(optionsString);
			if (this._context.parameters.optionsetFieldControl.attributes) {
				this._fieldOptions = this._context.parameters.optionsetFieldControl.attributes.Options;
				this.validateOptions(groupedOptions);
				this.createGroupedSelectControl(groupedOptions, container);
			}

		}

	}

	/**
	 * Used to validate the grouping json provided through input property "groupingOptions" by the user on the registered optionset field.
	 * @param groupedOptions : key value pair of json with key as "Group Name" and value as array of options belong to the group.
	 */

	private validateOptions(groupedOptions: any) {
		let unAvailableOptions: Array<number> = [];
		Object.keys(groupedOptions).forEach(key => {
			let gpOptions: Array<number> = groupedOptions[String(key)];
			let fieldOptionValues = this._fieldOptions.map(field => field.Value);
			unAvailableOptions = [...unAvailableOptions, ...gpOptions.filter(value => fieldOptionValues.indexOf(value) == -1)];

		});
		if (unAvailableOptions.length > 0) {
			throw new Error(`Passed Json in Grouping Options property have invalid optionset values ${unAvailableOptions.join(',')}.`);
		}
	}

	/**
	 * Used to create 
	 * @param groupedOptions 
	 * @param container 
	 */
	private createGroupedSelectControl(groupedOptions: any, container: HTMLDivElement) {
		this._selectContainer = document.createElement("select");
		for (let key of Object.keys(groupedOptions)) {
			let optGroupElement = document.createElement("optgroup");
			optGroupElement.label = key;
			let gpOptions: Array<Number> = groupedOptions[key];
			gpOptions.forEach(optionValue => {
				let fieldOption = this._fieldOptions.find(option => option.Value === optionValue);
				let option = document.createElement("option");
				if (fieldOption) {
					option.value = fieldOption.Value.toString();
					option.text = fieldOption.Label;
					if (fieldOption.Value === this._context.parameters.optionsetFieldControl.raw) {
						option.selected = true;
					}
					optGroupElement.appendChild(option);
				}
			});
			this._selectContainer.appendChild(optGroupElement);
		}
		container.appendChild(this._selectContainer);
		let selectOptions: Partial<Materilize.FormSelectOptions> = {
			dropdownOptions: {
				onOpenStart: this.onDropDownOpenStart.bind(this),
				onOpenEnd: this.onDropDownOpenEnd.bind(this),
				onCloseEnd: this.onDropDownCloseEnd.bind(this),
			}
		};
		this._dropdownInstance = Materilize.FormSelect.init(this._selectContainer, selectOptions);
	}

	private onDropDownOpenStart(ele: Element) {
		console.log("Dropdown Opened");
		let caretEle = document.querySelector(".caret");
		if (caretEle) {
			caretEle.classList.add("hide-caret");
		}
	}
	private onDropDownOpenEnd(ele: Element) {
		console.log("Dropdown Closed");
		let caretEle = document.querySelector(".caret");
		if (caretEle) {
			caretEle.classList.remove("hide-caret");
		}
	}

	private onDropDownCloseEnd(ele: Element) {
		this._value = +this._dropdownInstance.getSelectedValues()[0];
		this._notifyOutputChanged();
	}


	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void {
		// Add code to update control view
		this._value = context.parameters.optionsetFieldControl.raw;
		this._context = context;
	}

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs {
		return {
			optionsetFieldControl: this._value
		};
	}

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void {
		// Add code to cleanup control if necessary
		this._dropdownInstance.destroy();
	}
}