import { Input } from '../Input';

import { InputGroup as MainComponent } from './InputGroup';
import { InputGroupAddon } from './InputGroupAddon';
import { InputGroupButtonWrapper } from './InputGroupButtonWrapper';

interface InputGroupSubComponents {
  Addon: typeof InputGroupAddon;
  /**
   * Should wrap all buttons inside a InputGroup
   *
   * example:
   * ```
   * <InputGroup>
   *  <InputGroup.ButtonWrapper>
   *   <Button>...</Button>
   *   <Button>...</Button>
   *  </InputGroup.ButtonWrapper>
   * </InputGroup>
   * ```
   */
  ButtonWrapper: typeof InputGroupButtonWrapper;
  Input: typeof Input;
  className: string | undefined;
}

const InputGroup: typeof MainComponent & InputGroupSubComponents =
  MainComponent as typeof MainComponent & InputGroupSubComponents;

InputGroup.Addon = InputGroupAddon;
InputGroup.ButtonWrapper = InputGroupButtonWrapper;
InputGroup.Input = Input;

export { InputGroup };
