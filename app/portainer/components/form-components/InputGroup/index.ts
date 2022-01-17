import { Input } from '../Input';

import { InputGroup as MainComponent } from './InputGroup';
import { InputGroupAddon } from './InputGroupAddon';
import { InputGroupButtonWrapper } from './InputGroupButtonWrapper';

interface InputGroupSubComponents {
  Addon: typeof InputGroupAddon;
  ButtonWrapper: typeof InputGroupButtonWrapper;
  Input: typeof Input;
}

const InputGroup: typeof MainComponent & InputGroupSubComponents =
  MainComponent as typeof MainComponent & InputGroupSubComponents;

InputGroup.Addon = InputGroupAddon;
InputGroup.ButtonWrapper = InputGroupButtonWrapper;
InputGroup.Input = Input;

export { InputGroup };
