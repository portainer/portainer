import { CellContext } from '@tanstack/react-table';
import { X, Check, TagIcon } from 'lucide-react';
import { Form, Formik } from 'formik';
import { useStore } from 'zustand';
import { object, string } from 'yup';

import { Button } from '@@/buttons';
import { Tooltip } from '@@/Tip/Tooltip';
import { Input } from '@@/form-components/Input';
import { FormError } from '@@/form-components/FormError';

import { Tag } from '../types';
import { newNamesStore } from '../useRetagState';
import { getTableMeta } from '../meta';

import { helper } from './helper';
import { useDetails } from './buildCell';

export const actions = helper.display({
  header: 'Actions',
  cell: ActionsCell,
});

function ActionsCell({
  table,
  row: { original: item },
}: CellContext<Tag, unknown>) {
  const meta = getTableMeta(table.options.meta);
  const detailsQuery = useDetails(item.Name);
  const state = useStore(newNamesStore);

  const isEdit = state.updates[item.Name] !== undefined;

  if (!detailsQuery.data) {
    return null;
  }

  const tagDetails = detailsQuery.data;

  if (!isEdit) {
    return (
      <Button
        color="link"
        icon={TagIcon}
        onClick={() => state.setName(item.Name, tagDetails)}
        data-cy={`retag-${item.Name}`}
      >
        Retag
      </Button>
    );
  }

  return (
    <EditTag
      initialName={item.Name}
      onCancel={() => state.setName(item.Name)}
      onChange={(name) =>
        state.setName(item.Name, {
          ...tagDetails,
          Name: name,
        })
      }
      onSubmit={() => meta.onUpdate()}
    />
  );
}

const schema = object().shape({
  name: string()
    .required()
    .matches(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/),
});

function EditTag({
  initialName,
  onCancel,
  onChange,
  onSubmit,
}: {
  initialName: string;
  onChange: (name: string) => void;
  onCancel(): void;
  onSubmit(): void;
}) {
  return (
    <Formik
      initialValues={{ name: initialName }}
      onSubmit={onSubmit}
      validationSchema={schema}
    >
      {({ values, errors, setFieldValue }) => (
        <Form className="vertical-center">
          <Tooltip message="'Tag can only contain alphanumeric (a-zA-Z0-9) and special _ . - characters. Tag must not start with . - characters.'" />

          <Input
            className="input-sm"
            type="text"
            value={values.name}
            onChange={(e) => {
              setFieldValue('name', e.target.value);
              onChange(e.target.value);
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            data-cy={`retag-input-${initialName}`}
          />

          {errors.name && <FormError>{errors.name}</FormError>}

          <Button
            color="none"
            icon={X}
            onClick={onCancel}
            data-cy={`retag-cancel-${initialName}`}
          />
          <Button
            type="submit"
            color="none"
            icon={Check}
            data-cy={`retag-submit-${initialName}`}
          />
        </Form>
      )}
    </Formik>
  );
}
