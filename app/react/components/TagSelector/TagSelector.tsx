import clsx from 'clsx';
import _ from 'lodash';

import { TagId } from '@/portainer/tags/types';
import { useCreateTagMutation, useTags } from '@/portainer/tags/queries';

import { Creatable, Select } from '@@/form-components/ReactSelect';
import { FormControl } from '@@/form-components/FormControl';
import { Link } from '@@/Link';

import styles from './TagSelector.module.css';

interface Props {
  value: TagId[];
  allowCreate?: boolean;
  onChange(value: TagId[]): void;
}

interface Option {
  value: TagId;
  label: string;
}

export function TagSelector({ value, allowCreate = false, onChange }: Props) {
  // change the struct because react-select has a bug with Creatable (https://github.com/JedWatson/react-select/issues/3417#issuecomment-461868989)
  const tagsQuery = useTags((tags) =>
    tags.map((opt) => ({ label: opt.Name, value: opt.ID }))
  );

  const createTagMutation = useCreateTagMutation();

  if (!tagsQuery.tags) {
    return null;
  }

  const { tags } = tagsQuery;

  const selectedTags = _.compact(
    value.map((id) => tags.find((tag) => tag.value === id))
  );

  const SelectComponent = allowCreate ? Creatable : Select;

  if (!tags.length && !allowCreate) {
    return (
      <div className="form-group">
        <div className="col-sm-12 small text-muted">
          No tags available. Head over to the
          <Link to="portainer.tags" className="space-right space-left">
            Tags view
          </Link>
          to add tags
        </div>
      </div>
    );
  }

  return (
    <>
      {value.length > 0 && (
        <FormControl label="Selected tags">
          {selectedTags.map((tag) => (
            <button
              type="button"
              title="Remove tag"
              className={clsx(styles.removeTagBtn, 'space-left', 'tag')}
              onClick={() => handleRemove(tag.value)}
              key={tag.value}
            >
              {tag.label}
              <i
                className="fa fa-trash-alt white-icon space-left"
                aria-hidden="true"
              />
            </button>
          ))}
        </FormControl>
      )}

      <FormControl label="Tags" inputId="tags-selector">
        <SelectComponent
          inputId="tags-selector"
          value={[] as { label: string; value: number }[]}
          hideSelectedOptions
          options={tags.filter((tag) => !value.includes(tag.value))}
          closeMenuOnSelect={false}
          onChange={handleAdd}
          noOptionsMessage={() => 'No tags available'}
          formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
          onCreateOption={handleCreateOption}
        />
      </FormControl>
    </>
  );

  function handleAdd(tag?: Option | null) {
    if (!tag) {
      return;
    }
    onChange([...value, tag.value]);
  }

  function handleRemove(tagId: TagId) {
    onChange(value.filter((id) => id !== tagId));
  }

  function handleCreateOption(inputValue: string) {
    if (!allowCreate) {
      return;
    }
    createTagMutation.mutate(inputValue, {
      onSuccess(tag) {
        handleAdd({ label: tag.Name, value: tag.ID });
      },
    });
  }
}
