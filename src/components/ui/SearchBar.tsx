import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar = ({ value, onChange, placeholder = 'スレッドを検索...' }: SearchBarProps) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
      </div>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-4 pl-10 text-sm text-gray-900 rounded-lg bg-white/50 
                 border border-gray-200 focus:ring-blue-500 focus:border-blue-500
                 placeholder-gray-400"
        placeholder={placeholder}
      />
    </div>
  );
};
