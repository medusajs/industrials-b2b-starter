import { PropsWithChildren, useEffect } from "react";
import { FieldValues, FormProvider, UseFormReturn } from "react-hook-form";
import { useRouteModal } from "./use-route-modal";

type RouteModalFormProps<TFieldValues extends FieldValues> = PropsWithChildren<{
  form: UseFormReturn<TFieldValues>;
}>;

export const RouteModalForm = <TFieldValues extends FieldValues>({
  form,
  children,
}: RouteModalFormProps<TFieldValues>) => {
  const { setCloseOnEscape } = useRouteModal();
  const { formState } = form;
  const { isDirty } = formState;

  useEffect(() => {
    setCloseOnEscape(!isDirty);
  }, [isDirty, setCloseOnEscape]);

  return <FormProvider {...form}>{children}</FormProvider>;
};
