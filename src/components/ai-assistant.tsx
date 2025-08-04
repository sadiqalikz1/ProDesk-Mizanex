'use client';

import { useState } from 'react';
import { suggestConnections, type SuggestConnectionsOutput } from '@/ai/flows/suggest-connections';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Link as LinkIcon, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function AiAssistant() {
  const [openDocuments, setOpenDocuments] = useState(
    'Document 1: Notes on the Q3 marketing campaign performance. Key takeaways include a 20% increase in social media engagement but a 5% decrease in conversion rates.'
  );
  const [openTabs, setOpenTabs] = useState(
    'Tab 1: https://analytics.google.com/ - Real-time traffic data.\nTab 2: https://ads.google.com/ - Campaign performance metrics.'
  );
  const [suggestions, setSuggestions] = useState<SuggestConnectionsOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetSuggestions = async () => {
    setLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      const result = await suggestConnections({
        openDocuments: openDocuments.split('\n').filter(Boolean),
        openTabs: openTabs.split('\n').filter(Boolean),
      });
      setSuggestions(result);
    } catch (e) {
      setError('Failed to get suggestions. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle>AI Assistant</CardTitle>
        </div>
        <CardDescription>
          Monitors open tabs and docs to offer search suggestions and find connections.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label htmlFor="open-documents" className="text-sm font-medium">
              Open Documents
            </label>
            <Textarea
              id="open-documents"
              value={openDocuments}
              onChange={(e) => setOpenDocuments(e.target.value)}
              placeholder="Paste content of open documents, one per line."
              rows={5}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="open-tabs" className="text-sm font-medium">
              Open Tabs
            </label>
            <Textarea
              id="open-tabs"
              value={openTabs}
              onChange={(e) => setOpenTabs(e.target.value)}
              placeholder="List open browser tabs (URL or title), one per line."
              rows={5}
            />
          </div>
        </div>
        <div className="flex justify-center mb-6">
            <Button onClick={handleGetSuggestions} disabled={loading}>
            {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Sparkles className="mr-2 h-4 w-4" />
            )}
            Get Suggestions
            </Button>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {loading && !suggestions && (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {suggestions && (
          <div className="space-y-6 animate-in fade-in-50">
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><LinkIcon className="h-5 w-5"/>Suggested Connections</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {suggestions.suggestedConnections.map((conn, i) => (
                        <li key={i}>{conn}</li>
                    ))}
                    </ul>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Search className="h-5 w-5"/>Suggested Search Terms</h3>
                    <div className="flex flex-wrap gap-2">
                    {suggestions.suggestedSearchTerms.map((term, i) => (
                        <Button variant="secondary" size="sm" key={i}>{term}</Button>
                    ))}
                    </div>
                </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
