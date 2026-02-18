import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, RotateCcw, AlertTriangle } from "lucide-react";

interface Match {
  pageId: string;
  pageTitle: string;
  pageUrl: string;
  fieldPath: string;
  oldValue: string;
  newValue: string;
}

interface PreviewResult {
  matches: Match[];
  totalMatches: number;
  affectedPages: number;
  confirmToken: string;
}

interface AuditOperation {
  operation_id: string;
  created_at: string;
  search_term: string;
  replace_term: string;
  affected_count: number;
  rolled_back: boolean;
}

export default function AdminSearchReplace() {
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");

  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [operations, setOperations] = useState<AuditOperation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [rollbackOperationId, setRollbackOperationId] = useState<string | null>(
    null,
  );
  const [rollingBack, setRollingBack] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      // Get unique operations grouped by operation_id
      const { data, error } = await supabase
        .from("search_replace_audit")
        .select("operation_id, created_at, old_value, new_value, rolled_back")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by operation_id
      const operationMap = new Map<string, AuditOperation>();
      for (const record of data || []) {
        if (!operationMap.has(record.operation_id)) {
          // Extract search/replace terms from first record
          operationMap.set(record.operation_id, {
            operation_id: record.operation_id,
            created_at: record.created_at,
            search_term: "", // We'll infer from old_value
            replace_term: "", // We'll infer from new_value
            affected_count: 0,
            rolled_back: record.rolled_back,
          });
        }
        const op = operationMap.get(record.operation_id)!;
        op.affected_count++;
      }

      setOperations(Array.from(operationMap.values()));
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const handlePreview = async () => {
    if (!searchText.trim()) {
      setError("Search text is required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setPreviewResult(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch("/.netlify/functions/search-replace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          searchText,
          replaceText,
          caseSensitive,
          statusFilter,
          dryRun: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Preview failed");
      }

      setPreviewResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!previewResult?.confirmToken) return;

    setExecuting(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch("/.netlify/functions/search-replace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          searchText,
          replaceText,
          caseSensitive,
          statusFilter,
          dryRun: false,
          confirmToken: previewResult.confirmToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Execute failed");
      }

      setSuccessMessage(
        `Successfully replaced ${data.totalChanges} occurrences across ${data.affectedPages} pages. Operation ID: ${data.operationId.slice(0, 8)}...`,
      );
      setPreviewResult(null);
      setSearchText("");
      setReplaceText("");
      fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Execute failed");
    } finally {
      setExecuting(false);
      setConfirmDialogOpen(false);
    }
  };

  const handleRollback = async () => {
    if (!rollbackOperationId) return;

    setRollingBack(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch("/.netlify/functions/search-replace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rollback: true,
          operationId: rollbackOperationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Rollback failed");
      }

      setSuccessMessage(
        `Successfully rolled back ${data.restoredChanges} changes.`,
      );
      fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rollback failed");
    } finally {
      setRollingBack(false);
      setRollbackOperationId(null);
    }
  };

  const highlightMatch = (
    text: string,
    search: string,
    caseSensitive: boolean,
  ) => {
    if (!search) return text;

    const regex = new RegExp(
      `(${escapeRegex(search)})`,
      caseSensitive ? "g" : "gi",
    );
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const isMatch = caseSensitive
        ? part === search
        : part.toLowerCase() === search.toLowerCase();

      if (isMatch) {
        return (
          <mark key={i} className="bg-yellow-200 px-0.5 rounded">
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  const escapeRegex = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const truncateValue = (value: string, maxLength = 100) => {
    if (value.length <= maxLength) return value;
    return value.slice(0, maxLength) + "...";
  };

  const formatFieldPath = (path: string) => {
    // Make content paths more readable
    if (path.startsWith("content")) {
      return path
        .replace(/\[(\d+)\]/g, " › Item $1")
        .replace(/\./g, " › ")
        .replace("content", "Content");
    }
    // Capitalize simple field names
    return path.charAt(0).toUpperCase() + path.slice(1).replace(/_/g, " ");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Search & Replace</h1>
        <p className="text-gray-500 mt-1">
          Find and replace text across all page content
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      <Tabs defaultValue="search">
        <TabsList>
          <TabsTrigger value="search">Search & Replace</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Find and Replace</CardTitle>
              <CardDescription>
                Search for text in page titles, meta fields, and content blocks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search Text</Label>
                  <Input
                    id="search"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Text to find..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="replace">Replace With</Label>
                  <Input
                    id="replace"
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    placeholder="Replacement text..."
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="caseSensitive"
                    checked={caseSensitive}
                    onCheckedChange={setCaseSensitive}
                  />
                  <Label htmlFor="caseSensitive">Case sensitive</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Label>Status:</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) =>
                      setStatusFilter(v as typeof statusFilter)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handlePreview}
                  disabled={loading || !searchText.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Preview Matches
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {previewResult && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Preview Results</CardTitle>
                    <CardDescription>
                      Found {previewResult.totalMatches} matches across{" "}
                      {previewResult.affectedPages} pages
                    </CardDescription>
                  </div>
                  {previewResult.totalMatches > 0 && (
                    <Button onClick={() => setConfirmDialogOpen(true)}>
                      Apply Changes
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {previewResult.matches.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No matches found
                  </p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-48">Page</TableHead>
                          <TableHead className="w-40">Field</TableHead>
                          <TableHead>Current Value</TableHead>
                          <TableHead>New Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewResult.matches.map((match, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">
                                  {match.pageTitle}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {match.pageUrl}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="font-mono text-xs"
                              >
                                {formatFieldPath(match.fieldPath)}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <p
                                className="text-sm truncate"
                                title={match.oldValue}
                              >
                                {highlightMatch(
                                  truncateValue(match.oldValue),
                                  searchText,
                                  caseSensitive,
                                )}
                              </p>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <p
                                className="text-sm truncate text-green-700"
                                title={match.newValue}
                              >
                                {truncateValue(match.newValue)}
                              </p>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Operation History</CardTitle>
              <CardDescription>
                Recent search and replace operations with rollback capability
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
                </div>
              ) : operations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No operations yet
                </p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Operation ID</TableHead>
                        <TableHead>Changes</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operations.map((op) => (
                        <TableRow key={op.operation_id}>
                          <TableCell>
                            {new Date(op.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {op.operation_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {op.affected_count} changes
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {op.rolled_back ? (
                              <Badge
                                variant="outline"
                                className="text-gray-500"
                              >
                                Rolled back
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">
                                Applied
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!op.rolled_back && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setRollbackOperationId(op.operation_id)
                                }
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Rollback
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirm Execute Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Search & Replace</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to replace{" "}
                <strong>{previewResult?.totalMatches}</strong> occurrences
                across <strong>{previewResult?.affectedPages}</strong> pages.
              </p>
              <p className="text-sm">
                This action will be logged and can be rolled back from the
                History tab.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={executing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleExecute} disabled={executing}>
              {executing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                "Apply Changes"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Rollback Dialog */}
      <AlertDialog
        open={!!rollbackOperationId}
        onOpenChange={() => setRollbackOperationId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Rollback</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to rollback this operation? All changes made
              by this search & replace will be reverted to their original
              values.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rollingBack}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRollback}
              disabled={rollingBack}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {rollingBack ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rolling back...
                </>
              ) : (
                "Rollback"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
