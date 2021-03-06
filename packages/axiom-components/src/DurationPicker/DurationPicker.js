import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Duration } from 'luxon';
import omit from 'lodash.omit';
import Dropdown from '../Dropdown/Dropdown';
import DropdownContext from '../Dropdown/DropdownContext';
import DropdownMenu from '../Dropdown/DropdownMenu';
import DropdownMenuItem from '../Dropdown/DropdownMenuItem';
import DropdownSource from '../Dropdown/DropdownSource';
import DropdownTarget from '../Dropdown/DropdownTarget';
import Grid from '../Grid/Grid';
import GridCell from '../Grid/GridCell';
import TextInput from '../Form/TextInput';
import TextInputIcon from '../Form/TextInputIcon';

const validTimeUnits = ['seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'];

/**
 * This should be removed in favour of duration.toISO(),
 * only after the following PR has been merged
 * https://github.com/moment/luxon/pull/470
 */
const formatDuration = (duration) => {
  const filteredTimeUnits = []
    .concat(validTimeUnits)
    .reverse()
    .filter((timeUnit) => duration.values[timeUnit]);
  const timeDesignatorTimeUnits = validTimeUnits.slice(0, 3);
  const timeDesignatorIndex = filteredTimeUnits.findIndex((timeUnit) => timeDesignatorTimeUnits.includes(timeUnit));

  return filteredTimeUnits.reduce((memo, timeUnit, index) => {
    const timeDesignator = index === timeDesignatorIndex ? 'T' : '';
    const value = duration.values[timeUnit];
    const designator = timeUnit.slice(0, 1).toUpperCase();
    return `${memo}${timeDesignator}${value}${designator}`;
  }, 'P');
};

const getStateFromIsoDurationValue = (value) => {
  const duration = Duration.fromISO(value);

  if (!duration.isValid) {
    return {};
  }

  const selectedUnit = [].concat(validTimeUnits)
    .reverse()
    .find((timeUnit) => duration.values[timeUnit]);
  const selectedValue = duration.values[selectedUnit];

  return {
    selectedUnit,
    selectedValue,
    value,
  };
};

const getIsoDurationValueFromState = (state) => {
  const { selectedUnit, selectedValue } = state;

  if (!validTimeUnits.includes(selectedUnit) || !selectedValue) {
    return '';
  }

  const duration = Duration.fromObject({
    [selectedUnit]: selectedValue,
  });

  return formatDuration(duration);
};

const formatTimeUnit = (timeUnit) => {
  return `${timeUnit.slice(0, 1).toUpperCase()}${timeUnit.slice(1)}`;
};

export default class DurationPicker extends Component {
  static propTypes = {
    /** Excluded time-unit options */
    excludedOptions: PropTypes.arrayOf(PropTypes.oneOf(validTimeUnits)),
    /** Invoked when value or unit field has been blurred */
    onBlur: PropTypes.func,
    /** Invoked with the computed ISO duration value */
    onChange: PropTypes.func,
    /** Valid ISO duration value (see https://en.wikipedia.org/wiki/ISO_8601#Durations) [DISABLED] */
    value: PropTypes.string,
  };

  static defaultProps = {
    excludedOptions: ['seconds'],
    onBlur: () => {},
    onChange: () => {},
    value: 'P7D',
  };

  constructor(props) {
    super(props);

    this.onBlur = this.onBlur.bind(this);
    this.onChangeValue = this.onChangeValue.bind(this);
    this.onChangeUnit = this.onChangeUnit.bind(this);
    this.onChange = this.onChange.bind(this);

    this.state = getStateFromIsoDurationValue(props.value);
  }

  onBlur() {
    this.props.onBlur();
  }

  onChangeValue(event) {
    const inputValue = parseInt(event.target.value, 10);
    const selectedValue = Number.isFinite(inputValue) && inputValue >= 1 ? inputValue : '';
    const durationValue = getIsoDurationValueFromState({
      selectedUnit: this.state.selectedUnit,
      selectedValue,
    });

    this.setState({
      selectedValue,
      value: durationValue,
    }, this.onChange);
  }

  onChangeUnit(selectedUnit) {
    const durationValue = getIsoDurationValueFromState({
      selectedUnit,
      selectedValue: this.state.selectedValue,
    });

    this.setState({
      selectedUnit,
      value: durationValue,
    }, this.onChange);
  }

  onChange() {
    this.props.onChange(this.state.value);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value) {
      this.setState(getStateFromIsoDurationValue(this.props.value), this.onChange);
    }
  }

  render() {
    const { excludedOptions } = this.props;
    const childProps = omit(this.props, Object.keys(DurationPicker.propTypes));
    const filteredTimeUnits = validTimeUnits.filter((timeUnit) => !excludedOptions.includes(timeUnit));

    const {
      selectedUnit = filteredTimeUnits[0],
      selectedValue = '',
    } = this.state;

    return (
      <Grid
          fit={ true }
          gutters="tiny"
          responsive={ false }
          space="x0">
        <GridCell>
          <TextInput
              { ...childProps }
              onBlur={ this.onBlur }
              onChange={ this.onChangeValue }
              type="number"
              value={ (`${selectedValue}`) } />
        </GridCell>
        <GridCell>
          <Dropdown
              onRequestClose={ this.onBlur }>
            <DropdownTarget>
              <TextInput
                  { ...childProps }
                  isTarget
                  readOnly
                  value={ formatTimeUnit(selectedUnit) }>
                <TextInputIcon
                    name="chevron-down" />
              </TextInput>
            </DropdownTarget>
            <DropdownSource>
              <DropdownContext>
                <DropdownMenu>
                  {
                    filteredTimeUnits.map((timeUnit) => {
                      return (
                        <DropdownMenuItem
                            key={ timeUnit }
                            onClick={ () => this.onChangeUnit(timeUnit) }
                            selected={ timeUnit === selectedUnit }>
                          { formatTimeUnit(timeUnit) }
                        </DropdownMenuItem>
                      );
                    })
                  }
                </DropdownMenu>
              </DropdownContext>
            </DropdownSource>
          </Dropdown>
        </GridCell>
      </Grid>
    );
  }
}
