import { Meta } from '@storybook/react-webpack5';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { CommandPalette } from './CommandPalette';

export default {
  component: CommandPalette,
  title: 'Components/CommandPalette',
} as Meta;

const samplePaths = [
  'src/index.ts',
  'src/app.ts',
  'src/components/Button.tsx',
  'src/components/Input.tsx',
  'src/utils/string.ts',
  'src/utils/number.ts',
  'docker-compose.yml',
  'docker-compose.dev.yml',
  '.github/workflows/ci.yml',
  'package.json',
  'tsconfig.json',
  'README.md',
];

export function Default() {
  const [value, setValue] = useState('');

  return (
    <div className="relative w-[480px] rounded-md border border-solid border-gray-4 th-highcontrast:border-white th-dark:border-gray-7">
      <div className="flex items-center px-3 py-2">
        <CommandPalette
          value={value}
          onChange={setValue}
          onCompletion={() => {}}
          allFilePaths={samplePaths}
        />
      </div>
    </div>
  );
}

export function DropdownOnType() {
  const [value, setValue] = useState('');

  return (
    <div className="relative w-[480px] rounded-md border border-solid border-gray-4 th-highcontrast:border-white th-dark:border-gray-7">
      <div className="flex items-center px-3 py-2">
        <CommandPalette
          value={value}
          onChange={setValue}
          onCompletion={() => {}}
          allFilePaths={samplePaths}
          openDropdownOnFocus={false}
        />
      </div>
    </div>
  );
}

export function WithPortal() {
  const [value, setValue] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const portalTargetRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="w-[480px] overflow-hidden rounded-lg border border-solid border-gray-4 th-highcontrast:border-white th-dark:border-gray-7"
      onFocusCapture={() => setIsDropdownVisible(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDropdownVisible(false);
        }
      }}
    >
      <div className="flex items-center border-b border-l-0 border-r-0 border-t-0 border-solid border-gray-4 px-3 py-2 th-highcontrast:border-white th-dark:border-gray-7">
        <CommandPalette
          value={value}
          onChange={setValue}
          onCompletion={() => {}}
          allFilePaths={samplePaths}
          renderDropdown={(paths) => {
            if (!portalTargetRef.current) return null;
            return createPortal(
              paths.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-gray-6 th-highcontrast:text-gray-5 th-dark:text-gray-5">
                  No matching files
                </p>
              ) : (
                <>
                  {paths.map((path) => (
                    <div
                      key={path}
                      className="flex h-8 items-center px-3 hover:bg-gray-3 th-highcontrast:hover:bg-gray-iron-10 th-dark:hover:bg-gray-iron-10"
                    >
                      <span className="truncate font-mono text-[13px] text-gray-11 th-highcontrast:text-white th-dark:text-white">
                        /{path}
                      </span>
                    </div>
                  ))}
                </>
              ),
              portalTargetRef.current
            );
          }}
        />
      </div>
      <div
        ref={portalTargetRef}
        className="min-h-[120px] overflow-y-auto bg-white th-highcontrast:bg-black th-dark:bg-gray-iron-10"
      >
        {!isDropdownVisible && (
          <p className="px-3 py-4 text-center text-xs text-gray-6 th-highcontrast:text-gray-5 th-dark:text-gray-5">
            Portal target — type above to filter files; matches render here
          </p>
        )}
      </div>
    </div>
  );
}
