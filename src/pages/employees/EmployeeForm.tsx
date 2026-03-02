import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeFormSchema } from "@/lib/validators";
import type { z } from "zod/v4";
import { DEPARTMENTS, POSITIONS, EMPLOYMENT_TYPES } from "@/lib/constants";
import type { Employee } from "@/lib/db-client";

type EmployeeFormInput = z.input<typeof employeeFormSchema>;
type EmployeeFormOutput = z.output<typeof employeeFormSchema>;
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  onSubmit: (values: EmployeeFormOutput) => Promise<void>;
  loading?: boolean;
}

export function EmployeeForm({
  open,
  onOpenChange,
  employee,
  onSubmit,
  loading,
}: EmployeeFormProps) {
  const isEditing = !!employee;

  const form = useForm<EmployeeFormInput, unknown, EmployeeFormOutput>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      employeeNumber: "",
      lastName: "",
      firstName: "",
      lastNameKana: "",
      firstNameKana: "",
      birthDate: "",
      hireDate: "",
      department: "",
      position: "",
      employmentType: "full_time",
      baseSalary: 0,
      healthInsuranceNumber: "",
      pensionInsuranceNumber: "",
      employmentInsuranceNumber: "",
      dependents: 0,
    },
  });

  useEffect(() => {
    if (open && employee) {
      form.reset({
        employeeNumber: employee.employeeNumber,
        lastName: employee.lastName,
        firstName: employee.firstName,
        lastNameKana: employee.lastNameKana,
        firstNameKana: employee.firstNameKana,
        birthDate: employee.birthDate,
        hireDate: employee.hireDate,
        department: employee.department ?? "",
        position: employee.position ?? "",
        employmentType: employee.employmentType as "full_time" | "part_time" | "contract",
        baseSalary: employee.baseSalary,
        healthInsuranceNumber: employee.healthInsuranceNumber ?? "",
        pensionInsuranceNumber: employee.pensionInsuranceNumber ?? "",
        employmentInsuranceNumber: employee.employmentInsuranceNumber ?? "",
        dependents: employee.dependents,
      });
    } else if (open) {
      form.reset({
        employeeNumber: "",
        lastName: "",
        firstName: "",
        lastNameKana: "",
        firstNameKana: "",
        birthDate: "",
        hireDate: "",
        department: "",
        position: "",
        employmentType: "full_time",
        baseSalary: 0,
        healthInsuranceNumber: "",
        pensionInsuranceNumber: "",
        employmentInsuranceNumber: "",
        dependents: 0,
      });
    }
  }, [open, employee, form]);

  const handleSubmit = async (values: EmployeeFormOutput) => {
    await onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            {isEditing ? "従業員編集" : "従業員登録"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "従業員情報を編集します"
              : "新しい従業員を登録します"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)] px-6 pb-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              {/* 基本情報 */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">基本情報</h3>

                <FormField
                  control={form.control}
                  name="employeeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>社員番号</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="E001"
                          {...field}
                          disabled={isEditing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>姓</FormLabel>
                        <FormControl>
                          <Input placeholder="山田" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>名</FormLabel>
                        <FormControl>
                          <Input placeholder="太郎" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lastNameKana"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>姓（カナ）</FormLabel>
                        <FormControl>
                          <Input placeholder="ヤマダ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="firstNameKana"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>名（カナ）</FormLabel>
                        <FormControl>
                          <Input placeholder="タロウ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>生年月日</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hireDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>入社日</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* 所属情報 */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">所属情報</h3>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>部署</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="選択..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DEPARTMENTS.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>役職</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="選択..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {POSITIONS.map((pos) => (
                              <SelectItem key={pos} value={pos}>
                                {pos}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="employmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>雇用形態</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(EMPLOYMENT_TYPES).map(
                              ([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* 給与情報 */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">給与情報</h3>

                <FormField
                  control={form.control}
                  name="baseSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>基本給（円）</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="300000"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 社会保険情報 */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">社会保険情報</h3>

                <FormField
                  control={form.control}
                  name="healthInsuranceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>健康保険証番号</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pensionInsuranceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>年金手帳番号</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employmentInsuranceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>雇用保険被保険者番号</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dependents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>扶養人数</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={20}
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  キャンセル
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "保存中..." : "保存"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
