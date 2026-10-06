import { Table, Text } from "@medusajs/ui";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useQuotes } from "../../../hooks/api/quotes";
import { formatAmount } from "../../../utils";
import QuoteStatusBadge from "./quote-status-badge";

export const QuotesTable = () => {
  const navigate = useNavigate();
  const {
    quotes = [],
    count,
    isPending,
  } = useQuotes({
    order: "-created_at",
  });

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-8">
        <Text className="text-ui-fg-subtle">Loading quotes...</Text>
      </div>
    );
  }

  if (!quotes.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-y-2">
        <Text className="text-ui-fg-subtle font-medium">No quotes found</Text>
        <Text className="text-ui-fg-muted text-sm">
          There are currently no quotes. Create one from the storefront.
        </Text>
      </div>
    );
  }

  return (
    <div className="p-0">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>ID</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>Company</Table.HeaderCell>
            <Table.HeaderCell>Total</Table.HeaderCell>
            <Table.HeaderCell>Created</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {quotes.map((quote: any) => (
            <Table.Row
              key={quote.id}
              className="cursor-pointer hover:bg-ui-bg-base-hover"
              onClick={() => navigate(`/quotes/${quote.id}`)}
            >
              <Table.Cell>
                <Text className="txt-compact-small">
                  #{quote.draft_order?.display_id}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <QuoteStatusBadge status={quote.status} />
              </Table.Cell>
              <Table.Cell>
                <Text className="txt-compact-small">
                  {quote.customer?.email}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Text className="txt-compact-small">
                  {quote.draft_order?.customer?.employee?.company?.name || "-"}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Text className="txt-compact-small">
                  {quote.draft_order?.total != null
                    ? formatAmount(
                        quote.draft_order.total,
                        quote.draft_order.currency_code || "USD"
                      )
                    : "-"}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Text className="txt-compact-small">
                  {format(new Date(quote.created_at), "dd MMM yyyy")}
                </Text>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};
