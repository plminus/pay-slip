import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Employee {
  id: number;
  employeeNumber: string;
  lastName: string;
  firstName: string;
}

interface EmployeeComboboxProps {
  value?: number;
  onSelect: (employeeId: number) => void;
  employees: Employee[];
  placeholder?: string;
  disabled?: boolean;
}

export function EmployeeCombobox({
  value,
  onSelect,
  employees,
  placeholder = "従業員を選択...",
  disabled,
}: EmployeeComboboxProps) {
  const [open, setOpen] = useState(false);

  const selected = employees.find((e) => e.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selected
            ? `${selected.employeeNumber} - ${selected.lastName} ${selected.firstName}`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="検索..." />
          <CommandList>
            <CommandEmpty>従業員が見つかりません</CommandEmpty>
            <CommandGroup>
              {employees.map((employee) => (
                <CommandItem
                  key={employee.id}
                  value={`${employee.employeeNumber} ${employee.lastName} ${employee.firstName}`}
                  onSelect={() => {
                    onSelect(employee.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === employee.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {employee.employeeNumber} - {employee.lastName}{" "}
                  {employee.firstName}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
