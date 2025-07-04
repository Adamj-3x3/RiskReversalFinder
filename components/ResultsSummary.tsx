import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResultsSummary({ summary }: { summary: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Trade</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{summary}</p>
      </CardContent>
    </Card>
  );
} 