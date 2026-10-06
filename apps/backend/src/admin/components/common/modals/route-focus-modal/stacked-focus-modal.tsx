import { FocusModal, clx } from "@medusajs/ui";
import { PropsWithChildren } from "react";
import { useStackedModalItem } from "./use-stacked-modal";

type StackedFocusModalProps = PropsWithChildren<{
  id: string;
}>;

const Root = ({ id, children }: StackedFocusModalProps) => {
  const { isOpen, handleOpenChange } = useStackedModalItem(id);

  return (
    <FocusModal open={isOpen} onOpenChange={handleOpenChange}>
      <FocusModal.Title></FocusModal.Title>
      <FocusModal.Description></FocusModal.Description>
      {children}
    </FocusModal>
  );
};

const Trigger = FocusModal.Trigger;
const Close = FocusModal.Close;
const Header = FocusModal.Header;
const Footer = FocusModal.Footer;
const Body = FocusModal.Body;

const Content = ({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) => {
  return (
    <FocusModal.Content className={clx(className)}>{children}</FocusModal.Content>
  );
};

export const StackedFocusModal = Object.assign(Root, {
  Trigger,
  Close,
  Header,
  Footer,
  Body,
  Content,
});
