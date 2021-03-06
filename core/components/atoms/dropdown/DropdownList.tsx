import * as React from 'react';
import { scrollIntoView, _isEqual } from './utility';
import Popover, { Position, CustomStyle } from '@/components/molecules/popover';
import DropdownButton, { TriggerProps } from './DropdownButton';
import Checkbox from '@/components/atoms/checkbox';
import Option, { OptionRendererProps, OptionSchema } from './option';
import Button from '@/components/atoms/button';
import Text from '@/components/atoms/text';
import Input from '@/components/atoms/input';
import classNames from 'classnames';
import Loading from './Loading';
import { BaseProps, extractBaseProps } from '@/utils/types';

export type ChangeEvent = React.ChangeEvent<HTMLInputElement>;
export type DropdownAlign = 'left' | 'right';
export type OptionType =
  'DEFAULT' |
  'WITH_ICON' |
  'WITH_META' |
  'ICON_WITH_META';

const alignmentMapping = {
  right: 'bottom-start' as Position,
  left: 'bottom-end' as Position
};

export interface Selected {
  label: string;
  value: any;
}

export interface SelectAll {
  indeterminate: boolean;
  checked: boolean;
}

type ListProps = TriggerProps & OptionRendererProps;

export interface DropdownListProps extends ListProps {
  /**
   * Aligns the `Dropdown` left/right
   * @default "right"
   */
  align?: DropdownAlign;
  /**
   * Display message when there is no result
   * @default "No result found"
   */
  noResultMessage?: string;
  /**
   * Label of Select All checkbox
   * @default "Select All"
   */
  selectAllLabel?: string;
  /**
   * Label of Footer inside `Dropdown`
   * @default "Search for more options"
   */
  footerLabel?: string;
  /**
   * Label for selected options section
   * @default "Selected Items"
   */
  selectedSectionLabel?: string;
  /**
   * Determines if user can type to search for options (Always true for options count > 50)
   */
  withSearch?: boolean;
  /**
   * Determines if user can select more than one items
   */
  withCheckbox?: boolean;
  /**
   * Updates the value of selected array after apply button is clicked, applicable in case of multiple selections
   */
  showApplyButton?: boolean;
  /**
   * Trims label if it is too long
   * @default true
   */
  truncateOption?: boolean;
  /**
   * Total Options in database
   */
  totalOptions?: number;
  /**
   * Specifies max height of `Dropdown`
   * @default 200
   */
  maxHeight?: number;
  /**
   * Adds custom width to `Dropdown Popper`
   */
  width?: number;
  /**
   * Adds maximum width to `Dropdown Popper`
   */
  maxWidth?: number;
  /**
   * Adds minimum width to `Dropdown Popper`
   */
  minWidth?: number;
  /**
   * Number of loaders to be shown when loading is true
   * @default 10
   */
  loadersCount?: number;
}

interface OptionsProps extends DropdownListProps, BaseProps {
  listOptions: OptionSchema[];
  searchTerm: string;
  triggerLabel: string;
  loadingOptions?: boolean;
  searchInit?: boolean;
  dropdownOpen?: boolean;
  async?: boolean;
  remainingOptions: number;
  selected: OptionSchema[];
  tempSelected: OptionSchema[];
  previousSelected: OptionSchema[];
  selectAll: SelectAll;
  inputRef: React.RefObject<HTMLInputElement>;
  customTrigger?: (label: string) => React.ReactElement;
  applyOptions: () => void;
  cancelOptions: () => void;
  toggleDropdown: (open: boolean, type?: string) => void;
  onClearOptions: () => void;
  onSelectAll: (event: ChangeEvent) => void;
  onSearchChange?: (searchText: string) => void;
  onOptionSelect: (selected: any[] | any) => void;
  onSelect: (option: OptionSchema, checked: boolean) => void;
}

export const usePrevious = (value: any) => {
  const ref = React.useRef();
  React.useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};

const DropdownList = (props: OptionsProps) => {
  const {
    listOptions = [],
    inputRef,
    align = 'right',
    optionType = 'DEFAULT',
    truncateOption = true,
    maxHeight = 200,
    customTrigger,
    selected,
    tempSelected,
    previousSelected,
    remainingOptions,
    dropdownOpen,
    menu,
    searchTerm,
    showApplyButton,
    withCheckbox,
    withSearch,
    onSearchChange,
    optionRenderer,
    applyOptions,
    cancelOptions,
    toggleDropdown,
    className,
  } = props;

  const baseProps = extractBaseProps(props);

  const dropdownRef = React.createRef<HTMLDivElement>();
  const triggerRef = React.createRef<HTMLDivElement>();
  const dropdownTriggerRef = React.createRef<HTMLButtonElement>();
  const dropdownCancelButtonRef = React.createRef<HTMLButtonElement>();
  const dropdownApplyButtonRef = React.createRef<HTMLButtonElement>();

  const [popoverStyle, setPopoverStyle] = React.useState<CustomStyle>();
  const [cursor, setCursor] = React.useState(0);

  React.useEffect(() => {
    if (dropdownOpen) {
      const { width, minWidth, maxWidth } = props;
      const popperWidth = triggerRef.current?.clientWidth;
      const popperMinWidth = showApplyButton ? 176 : menu ? 128 : popperWidth;

      const popperWrapperStyle = {
        width: width ? width : popperWidth,
        minWidth: minWidth ? minWidth : popperMinWidth,
        maxWidth: maxWidth ? maxWidth : '100%',
      };

      setPopoverStyle(popperWrapperStyle);
    }
  }, [dropdownOpen]);

  const {
    triggerSize = 'regular',
    placeholder = 'Select',
    icon,
    error,
    disabled,
    inlineLabel,
    triggerLabel
  } = props;

  const CustomTrigger = customTrigger ? customTrigger(triggerLabel ? triggerLabel : placeholder) : <></>;
  const NewCustomTrigger = React.cloneElement(CustomTrigger, { tabindex: 0, ref: dropdownTriggerRef });

  const trigger = customTrigger ? NewCustomTrigger : (
    <DropdownButton
      placeholder={placeholder}
      triggerSize={triggerSize}
      icon={icon}
      disabled={disabled}
      inlineLabel={inlineLabel}
      menu={menu}
      error={error}
      ref={dropdownTriggerRef}
    >
      {triggerLabel}
    </DropdownButton>
  );

  const dropdownStyle: React.CSSProperties = {
    maxHeight,
    overflowY: 'auto',
    overflowX: 'hidden',
  };

  const getDropdownClass = (index: number, isGroup: boolean) => {
    const Dropdown = classNames({
      ['Dropdown--border']: isGroup && index !== 0,
    });

    return Dropdown;
  };

  const getDropdownSectionClass = (showClearButton?: boolean) => {
    return classNames({
      ['Dropdown-section']: true,
      ['Dropdown-section--withClear']: showClearButton
    });
  };

  const dropdownClass = classNames({
    ['Dropdown']: true,
  }, className);

  const dropdownWrapperClass = classNames({
    ['Dropdown-wrapper']: true,
    ['Dropdown-wrapper--wrap']: !truncateOption,
  });

  const SelectAllClass = classNames({
    ['Option']: true,
    ['Option--withCheckbox']: true,
    ['Option-wrapper']: true,
    ['Option--active']: cursor === 0
  });

  const onToggleDropdown = (open: boolean, type?: string) => {
    toggleDropdown(open, type);
    if (!disabled) dropdownTriggerRef.current?.focus();
    setCursor(0);
  };

  const onCancelOptions = () => {
    cancelOptions();
    dropdownTriggerRef.current?.focus();
  };

  const onApplyOptions = () => {
    applyOptions();
    dropdownTriggerRef.current?.focus();
  };

  const optionClickHandler = (item: any) => {
    props.onOptionSelect(item);
    dropdownTriggerRef.current?.focus();
  };

  const searchClearHandler = () => {
    setCursor(0);
    if (onSearchChange && searchTerm) onSearchChange('');
  };

  const searchHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCursor(0);
    if (onSearchChange) onSearchChange(event.target.value);
  };

  const updateActiveOption = (index: number, parentCheckbox?: boolean) => {
    const updatedIndex = withCheckbox && !props.async && !parentCheckbox ? index + 1 : index;
    setCursor(updatedIndex);
  };

  const renderFooter = () => {
    const { footerLabel = 'Search for more options' } = props;
    return (
      <div className={'Dropdown-footer'}>
        <Text small={true} appearance={'subtle'}>{footerLabel}</Text>
      </div>
    );
  };

  const renderGroups = (group: string, selectedGroup?: boolean) => {
    const { onClearOptions } = props;
    return (
      <div className={getDropdownSectionClass(selectedGroup)}>
        <Text small={true} appearance={'subtle'}>{group}</Text>
        {selectedGroup && (
          <Button onClick={onClearOptions} appearance="transparent" size="tiny">Clear</Button>
        )}
      </div>
    );
  };

  const renderApplyButton = () => {
    const disable = _isEqual(previousSelected, tempSelected);
    return (
      <div className={'Dropdown-buttonWrapper'}>
        <Button
          ref={dropdownCancelButtonRef}
          className="mr-4"
          appearance={'basic'}
          onClick={onCancelOptions}
          size={'tiny'}
          tabIndex={-1}
        >
          Cancel
        </Button>
        <Button
          ref={dropdownApplyButtonRef}
          appearance={'primary'}
          disabled={disable}
          size={'tiny'}
          onClick={onApplyOptions}
        >
          Apply
        </Button>
      </div>
    );
  };

  const renderSearch = () => {
    const { loadingOptions, searchInit } = props;
    const disable = loadingOptions && !searchInit;
    return (
      <div className={'Dropdown-input'}>
        <Input
          name="Dropdown-search"
          icon={'search'}
          value={searchTerm}
          placeholder={'Search..'}
          disabled={disable}
          autoFocus={true}
          onChange={searchHandler}
          onClear={searchClearHandler}
          ref={inputRef}
          autocomplete={'off'}
        />
      </div>
    );
  };

  const renderLoading = (loadersLength: number) => {
    const arr = Array(loadersLength).fill('Loading');
    const type = withCheckbox ? 'WITH_CHECKBOX' : optionType;
    return (
      arr.map((option, ind) => {
        return (
          <div className="Option-loading" key={`${option}-${ind}`}>
            <Loading loadingType={type} />
          </div>
        );
      })
    );
  };

  const renderSelectAll = () => {
    const {
      selectAllLabel = 'Select All',
      selectAll,
      onSelectAll
    } = props;

    const label = selectAllLabel.trim() ? selectAllLabel.trim() : 'Select All';
    return (
      <div className={SelectAllClass} onMouseEnter={_e => updateActiveOption(0, true)}>
        <Checkbox
          label={label}
          onChange={onSelectAll}
          checked={selectAll.checked}
          indeterminate={selectAll.indeterminate}
          tabIndex={-1}
        />
      </div>
    );
  };

  const renderOptions = (item: OptionSchema, index: number) => {
    const selectAllPresent = withCheckbox && remainingOptions === 0 && searchTerm === '';
    const active = selectAllPresent ? index + 1 === cursor : index === cursor;
    const optionIsSelected = tempSelected.findIndex(option => option.value === item.value) !== -1;

    return (
      <Option
        optionData={item}
        truncateOption={truncateOption}
        selected={optionIsSelected}
        index={index}
        updateActiveOption={updateActiveOption}
        optionRenderer={optionRenderer}
        active={active}
        checkboxes={withCheckbox}
        menu={menu}
        onClick={() => optionClickHandler(item)}
        onChange={e => props.onSelect(item, e.target.checked)}
        optionType={props.optionType}
      />
    );
  };

  const renderDropdownSection = () => {
    const { selectedSectionLabel = 'Selected Items', loadersCount = 10, loadingOptions } = props;
    if (loadersCount && loadingOptions) {
      return (
        <div className={'Dropdown-loading'}>
          <div className="Dropdown-wrapper" style={dropdownStyle}>
            {
              renderLoading(loadersCount)
            }
          </div>
        </div>
      );
    }

    if (listOptions.length === 0 && !loadingOptions) {
      const { noResultMessage = 'No result found' } = props;
      return (
        <div className={'Dropdown-errorWrapper'}>
          <div className={'Option'}>
            <div className={'Option-subinfo'}>{noResultMessage}</div>
          </div>
        </div>
      );
    }

    return (
      <div className={dropdownWrapperClass} style={dropdownStyle} ref={dropdownRef}>
        {withCheckbox && remainingOptions === 0 && searchTerm === '' && renderSelectAll()}
        {selected.length > 0 && renderGroups(selectedSectionLabel, true)}
        {
          selected.map((option, index) =>
            renderOptions(option, index)
          )
        }
        {
          listOptions.map((option, index) => {
            const prevGroup = index > 0 ?
              listOptions[index - 1].group : selected.length ? selectedSectionLabel : undefined;
            const currentGroup = option.group;
            const isGroup = prevGroup !== currentGroup;
            const updatedIndex = index + selected.length;

            return (
              <div className={getDropdownClass(updatedIndex, isGroup)} key={index}>
                {isGroup && currentGroup && renderGroups(currentGroup)}
                {renderOptions(option, updatedIndex)}
              </div>
            );
          })
        }
        {props.async && remainingOptions > 0 && renderFooter()}
      </div>
    );
  };

  const focusOption = (direction: string, classes: string) => {
    const updatedCursor = direction === 'down' ? cursor + 1 : cursor - 1;
    const elements = document.querySelectorAll(classes);
    const element: HTMLElement = elements[updatedCursor] as HTMLElement;
    if (element) scrollIntoView(dropdownRef.current, element);
    if (element !== undefined) setCursor(updatedCursor);
  };

  const onkeydown = (event: any) => {
    const optionClass = optionRenderer ? '.Option-wrapper' : '.Option';
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        dropdownOpen ? focusOption('down', optionClass) : onToggleDropdown(!dropdownOpen);
        break;
      case 'ArrowUp':
        event.preventDefault();
        dropdownOpen ? focusOption('up', optionClass) : onToggleDropdown(!dropdownOpen);
        break;
      case 'Enter':
        const activeElement = document.activeElement;
        if (
          dropdownOpen &&
          (inputRef.current === activeElement || dropdownTriggerRef.current === activeElement)
        ) {
          event.preventDefault();
          const classes = withCheckbox ? `${optionClass} .Checkbox-input` : optionClass;
          const elements = document.querySelectorAll(classes);
          const element = elements[cursor] as HTMLElement;
          if (element) element.click();
        }
        if (!dropdownOpen) onToggleDropdown(!dropdownOpen);
        break;
      case 'Tab':
        if (!showApplyButton && dropdownOpen) {
          event.preventDefault();
          onToggleDropdown(false, 'onClick');
          return;
        }

        const currentElement = document.activeElement;
        const disabledApplyButton = dropdownApplyButtonRef.current?.disabled;

        if (
          ((currentElement === dropdownCancelButtonRef.current
            && disabledApplyButton
          )
            || currentElement === dropdownApplyButtonRef.current
          ) && dropdownOpen
        ) {
          event.preventDefault();
          onToggleDropdown(false, 'onClick');
          return;
        }

        if (showApplyButton && dropdownOpen) {
          event.preventDefault();
          if (currentElement === dropdownCancelButtonRef.current) {
            dropdownApplyButtonRef.current?.focus();
          } else {
            dropdownCancelButtonRef.current?.focus();
          }
        }

        break;
      default:
        break;
    }
  };

  return (
    <div
      {...baseProps}
      className={dropdownClass}
      ref={triggerRef}
      onKeyDown={onkeydown}
    >
      <Popover
        onToggle={onToggleDropdown}
        trigger={trigger}
        triggerClass={!menu ? 'w-100' : ''}
        open={dropdownOpen}
        customStyle={popoverStyle}
        position={alignmentMapping[align]}
        appendToBody={true}
      >
        {(withSearch || props.async) && renderSearch()}
        {renderDropdownSection()}
        {showApplyButton && withCheckbox && renderApplyButton()}
      </Popover >
    </div>
  );
};

DropdownList.displayName = 'DropdownList';

export default DropdownList;
