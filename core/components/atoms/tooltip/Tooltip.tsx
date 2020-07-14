import * as React from 'react';
import { Omit } from 'utility-types';
import { PopperWrapper } from '@/utils';
import classNames from 'classnames';

export type PositionType =
  'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'right';
type DivProps = Omit<JSX.IntrinsicElements['div'], 'ref'>;

export interface TooltipProps extends DivProps {
  /**
   * Text to be rendered in `Tooltip`
   */
  tooltip: string;
  /**
   * Component to be rendered as trigger for `Tooltip`
   */
  children: React.ReactElement<any>;
  /**
   * Position to place the `Tooltip`
   * @default "bottom"
   */
  position?: PositionType;
  /**
   * Appends `Tooltip` wrapper inside body
   * @default true
   */
  appendToBody?: boolean;
}

interface IState {
  position: {
    top: number;
    left: number;
  };
  style: React.CSSProperties;
  open: boolean;
}

/**
 * Tooltip is used to displays floating content in relation to a target when that target is hovered.
 *
 * Tooltips mostly appear either at the top or bottom of their target.
 * The preferred and default side is the bottom.
 *
 * For left navigation with only icons, show tooltip on the right.
 */
export class Tooltip extends React.Component<TooltipProps, IState> {
  constructor(props: TooltipProps) {
    super(props);

    this.state = {
      position: {
        top: 0,
        left: 0,
      },
      style: {},
      open: false
    };
  }

  public onToggle = (open: boolean) => {
    this.setState({ open });
  }

  componentWillUnmount() {
    this.setState({ open: false });
  }

  public render() {
    const {
      appendToBody = true,
      position = 'bottom',
      tooltip,
      children,
      className,
      ...props
    } = this.props;

    const classes = classNames({
      ['Tooltip']: true
    }, className);

    const tooltipWrapper = (
      <div
        className={classes}
        {...props}
        style={this.state.style}
      >
        {tooltip}
      </div>
    );

    return (
      <PopperWrapper
        trigger={children}
        placement={this.props.position}
        style={this.state.style}
        appendToBody={appendToBody}
        on={'hover'}
        offset={'Medium'}
        onToggle={this.onToggle}
        open={this.state.open}
      >
        {tooltipWrapper}
      </PopperWrapper>
    );
  }
}

export default Tooltip;
