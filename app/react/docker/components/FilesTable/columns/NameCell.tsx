import { CellContext } from '@tanstack/react-table';
import { Check, File as FileIcon, Folder, X } from 'lucide-react';
import { Form, Formik } from 'formik';

import { Icon } from '@@/Icon';
import { Button } from '@@/buttons';
import { Input } from '@@/form-components/Input';

import { FileData } from '../types';

export function NameCell({
  getValue,
  row: { original: item },
  table,
}: CellContext<FileData, string>) {
  const name = getValue();
  const isEdit = table.options.meta?.isEdit(name);

  if (item.custom) {
    return item.custom;
  }

  if (isEdit) {
    return (
      <EditForm
        originalName={name}
        onSave={handleRename}
        onClose={() => table.options.meta?.setIsEdit(name, false)}
      />
    );
  }

  return (
    <>
      {item.Dir ? (
        <Button
          color="link"
          className="!ml-0 p-0"
          onClick={() => table.options.meta?.onBrowse(name)}
          icon={Folder}
        >
          {name}
        </Button>
      ) : (
        <span className="vertical-center">
          <Icon icon={FileIcon} />
          {name}
        </span>
      )}
    </>
  );

  function handleRename(name: string) {
    table.options.meta?.onRename(item.Name, name);
    table.options.meta?.setIsEdit(name, false);
  }
}

function EditForm({
  originalName,
  onSave,
  onClose,
}: {
  originalName: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  return (
    <Formik
      initialValues={{ name: originalName }}
      onSubmit={({ name }) => onSave(name)}
      onReset={onClose}
    >
      {({ values, setFieldValue }) => (
        <Form className="flex items-center">
          <Input
            name="name"
            value={values.name}
            onChange={(e) => setFieldValue('name', e.target.value)}
            className="input-sm w-auto"
          />

          <Button color="none" type="reset" icon={X} />

          <Button color="none" type="submit" icon={Check} />
        </Form>
      )}
    </Formik>
  );
}
