/** Simulate user events on react-select dropdowns
 *
 * taken from https://github.com/lokalise/react-select-event/blob/migrate-to-user-event/src/index.ts
 * until package is updated
 */

import {
  Matcher,
  findAllByText,
  findByText,
  waitFor,
} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

// find the react-select container from its input field 🤷
function getReactSelectContainerFromInput(input: HTMLElement): HTMLElement {
  return input.parentNode!.parentNode!.parentNode!.parentNode!
    .parentNode as HTMLElement;
}

type User = ReturnType<typeof userEvent.setup> | typeof userEvent;

type UserEventOptions = {
  user?: User;
};

/**
 * Utility for opening the select's dropdown menu.
 * @param {HTMLElement} input The input field (eg. `getByLabelText('The label')`)
 */
export async function openMenu(
  input: HTMLElement,
  { user = userEvent }: UserEventOptions = {}
) {
  await user.click(input);
  await user.type(input, '{ArrowDown}');
}

// type text in the input field
async function type(
  input: HTMLElement,
  text: string,
  { user }: Required<UserEventOptions>
) {
  await user.type(input, text);
}

// press the "clear" button, and reset various states
async function clear(
  clearButton: Element,
  { user }: Required<UserEventOptions>
) {
  await user.click(clearButton);
}

interface Config extends UserEventOptions {
  /** A container where the react-select dropdown gets rendered to.
   *  Useful when rendering the dropdown in a portal using `menuPortalTarget`.
   */
  container?: HTMLElement | (() => HTMLElement);
}

/**
 * Utility for selecting a value in a `react-select` dropdown.
 * @param {HTMLElement} input The input field (eg. `getByLabelText('The label')`)
 * @param {Matcher|Matcher[]} optionOrOptions The display name(s) for the option(s) to select
 * @param {Object} config Optional config options
 * @param {HTMLElement | (() => HTMLElement)} config.container A container for the react-select and its dropdown (defaults to the react-select container)
 *            Useful when rending the dropdown to a portal using react-select's `menuPortalTarget`.
 *            Can be specified as a function if it needs to be lazily evaluated.
 */
export async function select(
  input: HTMLElement,
  optionOrOptions: Matcher | Array<Matcher>,
  { user = userEvent, ...config }: Config = {}
) {
  const options = Array.isArray(optionOrOptions)
    ? optionOrOptions
    : [optionOrOptions];

  // Select the items we care about
  // eslint-disable-next-line no-restricted-syntax
  for (const option of options) {
    await openMenu(input, { user });

    let container;
    if (typeof config.container === 'function') {
      // when specified as a function, the container needs to be lazily evaluated, so
      // we have to wait for it to be visible:
      await waitFor(config.container);
      container = config.container();
    } else if (config.container) {
      container = config.container;
    } else {
      container = getReactSelectContainerFromInput(input);
    }

    // only consider visible, interactive elements
    const matchingElements = await findAllByText(container, option, {
      ignore: "[aria-live] *,[style*='visibility: hidden']",
    });

    // When the target option is already selected, the react-select display text
    // will also match the selector. In this case, the actual dropdown element is
    // positioned last in the DOM tree.
    const optionElement = matchingElements[matchingElements.length - 1];
    await user.click(optionElement);
  }
}

interface CreateConfig extends Config, UserEventOptions {
  createOptionText?: string | RegExp;
  waitForElement?: boolean;
}
/**
 * Utility for creating and selecting a value in a Creatable `react-select` dropdown.
 * @async
 * @param {HTMLElement} input The input field (eg. `getByLabelText('The label')`)
 * @param {String} option The display name for the option to type and select
 * @param {Object} config Optional config options
 * @param {HTMLElement} config.container A container for the react-select and its dropdown (defaults to the react-select container)
 *                         Useful when rending the dropdown to a portal using react-select's `menuPortalTarget`
 * @param {boolean} config.waitForElement Whether create should wait for new option to be populated in the select container
 * @param {String|RegExp} config.createOptionText Custom label for the "create new ..." option in the menu (string or regexp)
 */
export async function create(
  input: HTMLElement,
  option: string,
  { waitForElement = true, user = userEvent, ...config }: CreateConfig = {}
) {
  const createOptionText = config.createOptionText || /^Create "/;
  await openMenu(input, { user });
  await type(input, option, { user });

  await select(input, createOptionText, { ...config, user });

  if (waitForElement) {
    await findByText(getReactSelectContainerFromInput(input), option);
  }
}

/**
 * Utility for clearing the first value of a `react-select` dropdown.
 * @param {HTMLElement} input The input field (eg. `getByLabelText('The label')`)
 */
export async function clearFirst(
  input: HTMLElement,
  { user = userEvent }: UserEventOptions = {}
) {
  const container = getReactSelectContainerFromInput(input);
  // The "clear" button is the first svg element that is hidden to screen readers
  const clearButton = container.querySelector('svg[aria-hidden="true"]')!;
  await clear(clearButton, { user });
}

/**
 * Utility for clearing all values in a `react-select` dropdown.
 * @param {HTMLElement} input The input field (eg. `getByLabelText('The label')`)
 */
export async function clearAll(
  input: HTMLElement,
  { user = userEvent }: UserEventOptions = {}
) {
  const container = getReactSelectContainerFromInput(input);
  // The "clear all" button is the penultimate svg element that is hidden to screen readers
  // (the last one is the dropdown arrow)
  const elements = container.querySelectorAll('svg[aria-hidden="true"]');
  const clearAllButton = elements[elements.length - 2];
  await clear(clearAllButton, { user });
}

function setup(user: User): typeof selectEvent {
  return {
    select: (...params: Parameters<typeof select>) =>
      select(params[0], params[1], { user, ...params[2] }),
    create: (...params: Parameters<typeof create>) =>
      create(params[0], params[1], { user, ...params[2] }),
    clearFirst: (...params: Parameters<typeof clearFirst>) =>
      clearFirst(params[0], { user, ...params[1] }),
    clearAll: (...params: Parameters<typeof clearAll>) =>
      clearAll(params[0], { user, ...params[1] }),
    openMenu: (...params: Parameters<typeof openMenu>) =>
      openMenu(params[0], { user, ...params[1] }),
  };
}

const selectEvent = { select, create, clearFirst, clearAll, openMenu };
export default { ...selectEvent, setup };
