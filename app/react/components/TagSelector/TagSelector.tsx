import _ from 'lodash';

import { TagId } from '@/portainer/tags/types';
import { useCreateTagMutation, useTags } from '@/portainer/tags/queries';

import { Creatable, Select } from '@@/form-components/ReactSelect';
import { FormControl } from '@@/form-components/FormControl';
import { Link } from '@@/Link';
import { ArrayError } from '@@/form-components/InputList/InputList';

import { TagButton } from '../TagButton';

interface Props {
  value: TagId[];
  allowCreate?: boolean;
  onChange(value: TagId[]): void;
  errors?: ArrayError<TagId[]>;
}

interface Option {
  value: TagId;
  label: string;
}

export function TagSelector({
  value,
  allowCreate = false,
  onChange,
  errors,
}: Props) {
  // change the struct because react-select has a bug with Creatable (https://github.com/JedWatson/react-select/issues/3417#issuecomment-461868989)
  const tagsQuery = useTags({
    select: (tags) => tags?.map((opt) => ({ label: opt.Name, value: opt.ID })),
  });

  const createTagMutation = useCreateTagMutation();

  if (!tagsQuery.data) {
    return null;
  }

  const { data: tags } = tagsQuery;

  const selectedTags = _.compact(
    value.map((id) => tags.find((tag) => tag.value === id))
  );

  const SelectComponent = allowCreate ? Creatable : Select;

  if (!tags.length && !allowCreate) {
    return (
      <div className="form-group">
        <div className="col-sm-12 small text-muted">
          No tags available. Head over to the
          <Link
            to="portainer.tags"
            className="space-right space-left"
            data-cy="environment-tags-view-link"
          >
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
          <div data-cy="selected-tags">
            {selectedTags.map((tag) => (
              <TagButton
                key={tag.value}
                title="Remove tag"
                value={tag.value}
                label={tag.label}
                onRemove={() => handleRemove(tag.value)}
              />
            ))}
          </div>
        </FormControl>
      )}

      <FormControl
        label="Tags"
        inputId="tags-selector"
        errors={
          typeof errors === 'string'
            ? errors
            : errors?.map((e) => e?.toString())
        }
      >
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
          aria-label="Tags"
          data-cy="environment-tags-selector"
          id="environment-tags-selector"
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

    // Prevent the new tag composed of space from being added
    if (!inputValue.replace(/\s/g, '').length) {
      return;
    }

    createTagMutation.mutate(inputValue, {
      onSuccess(tag) {
        handleAdd({ label: tag.Name, value: tag.ID });
      },
    });
  }
}
