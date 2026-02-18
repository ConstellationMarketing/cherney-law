import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import type {
  SiteSettings,
  NavigationItem,
  NavItem,
  FooterLink,
  FooterLocation,
  FooterLocationLine,
  SocialLink,
  SiteSettingsRow,
} from "../../lib/siteSettingsTypes";
import {
  DEFAULT_SITE_SETTINGS,
  rowToSiteSettings,
  siteSettingsToRow,
} from "../../lib/siteSettingsTypes";
import { clearSiteSettingsCache } from "../../hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Search,
  BarChart3,
  Code,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useUserRole } from "../../hooks/useUserRole";

export default function AdminSiteSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("settings_key", "global")
      .single();

    if (error) {
      console.error("Error fetching settings:", error);
      // Use defaults if not found
      setLoading(false);
      return;
    }

    if (data) {
      setSettingsId(data.id);
      setSettings(rowToSiteSettings(data as SiteSettingsRow));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    const rowData = siteSettingsToRow(settings);

    let error;
    if (settingsId) {
      // Update existing
      const result = await supabase
        .from("site_settings")
        .update(rowData)
        .eq("id", settingsId);
      error = result.error;
    } else {
      // Insert new
      const result = await supabase
        .from("site_settings")
        .insert({ ...rowData, settings_key: "global" });
      error = result.error;
    }

    if (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings: " + error.message);
    } else {
      // Clear the cache so components refetch
      clearSiteSettingsCache();
      alert("Settings saved successfully!");
    }
    setSaving(false);
  };

  const updateSettings = (updates: Partial<SiteSettings>) => {
    setSettings({ ...settings, ...updates });
  };

  // Generate unique ID for nav items
  const generateNavId = () =>
    `nav-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  // Navigation items handlers (nested support)
  const addNavItem = () => {
    const newItem: NavItem = {
      id: generateNavId(),
      label: "",
      href: "/",
      order: settings.navigationItems.length + 1,
    };
    updateSettings({
      navigationItems: [...settings.navigationItems, newItem],
    });
  };

  const updateNavItem = (parentIndex: number, childIndex: number | undefined, updates: Partial<NavItem>) => {
    const items = [...settings.navigationItems];

    if (childIndex !== undefined) {
      // Update child item
      const parent = items[parentIndex];
      if (parent.children) {
        const children = [...parent.children];
        children[childIndex] = { ...children[childIndex], ...updates };
        items[parentIndex] = { ...parent, children };
      }
    } else {
      // Update parent item
      items[parentIndex] = { ...items[parentIndex], ...updates };
    }

    updateSettings({ navigationItems: items });
  };

  const removeNavItem = (parentIndex: number, childIndex: number | undefined) => {
    const items = [...settings.navigationItems];

    if (childIndex !== undefined) {
      // Remove child item
      const parent = items[parentIndex];
      if (parent.children) {
        const children = parent.children.filter((_, i) => i !== childIndex);
        // If no children left, remove children property
        items[parentIndex] = {
          ...parent,
          children: children.length > 0 ? children : undefined
        };
      }
    } else {
      // Remove parent item
      return updateSettings({
        navigationItems: items.filter((_, i) => i !== parentIndex)
      });
    }

    updateSettings({ navigationItems: items });
  };

  const addChildNavItem = (parentIndex: number) => {
    const items = [...settings.navigationItems];
    const parent = items[parentIndex];
    const newChild: NavItem = {
      id: generateNavId(),
      label: "",
      href: "/",
    };

    items[parentIndex] = {
      ...parent,
      children: [...(parent.children || []), newChild],
    };

    updateSettings({ navigationItems: items });
  };

  const moveNavItem = (index: number, direction: 'up' | 'down') => {
    const items = [...settings.navigationItems];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= items.length) return;

    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    updateSettings({ navigationItems: items });
  };

  // Footer About links handlers
  const addAboutLink = () => {
    updateSettings({
      footerAboutLinks: [...settings.footerAboutLinks, { label: "" }],
    });
  };

  const updateAboutLink = (index: number, updates: Partial<FooterLink>) => {
    const items = [...settings.footerAboutLinks];
    items[index] = { ...items[index], ...updates };
    updateSettings({ footerAboutLinks: items });
  };

  const removeAboutLink = (index: number) => {
    const items = settings.footerAboutLinks.filter((_, i) => i !== index);
    updateSettings({ footerAboutLinks: items });
  };

  // Footer Practice links handlers
  const addPracticeLink = () => {
    updateSettings({
      footerPracticeLinks: [...settings.footerPracticeLinks, { label: "" }],
    });
  };

  const updatePracticeLink = (index: number, updates: Partial<FooterLink>) => {
    const items = [...settings.footerPracticeLinks];
    items[index] = { ...items[index], ...updates };
    updateSettings({ footerPracticeLinks: items });
  };

  const removePracticeLink = (index: number) => {
    const items = settings.footerPracticeLinks.filter((_, i) => i !== index);
    updateSettings({ footerPracticeLinks: items });
  };

  // Social links handlers
  const addSocialLink = () => {
    updateSettings({
      socialLinks: [
        ...settings.socialLinks,
        { platform: "facebook", url: "", enabled: true },
      ],
    });
  };

  const updateSocialLink = (index: number, updates: Partial<SocialLink>) => {
    const items = [...settings.socialLinks];
    items[index] = { ...items[index], ...updates };
    updateSettings({ socialLinks: items });
  };

  const removeSocialLink = (index: number) => {
    const items = settings.socialLinks.filter((_, i) => i !== index);
    updateSettings({ socialLinks: items });
  };

  // Footer Locations handlers
  const addFooterLocation = () => {
    updateSettings({
      footerLocations: [
        ...settings.footerLocations,
        { title: "", lines: [] },
      ],
    });
  };

  const updateFooterLocation = (index: number, updates: Partial<FooterLocation>) => {
    const items = [...settings.footerLocations];
    items[index] = { ...items[index], ...updates };
    updateSettings({ footerLocations: items });
  };

  const removeFooterLocation = (index: number) => {
    const items = settings.footerLocations.filter((_, i) => i !== index);
    updateSettings({ footerLocations: items });
  };

  const addLocationLine = (locationIndex: number) => {
    const items = [...settings.footerLocations];
    items[locationIndex].lines = [
      ...items[locationIndex].lines,
      { text: "" },
    ];
    updateSettings({ footerLocations: items });
  };

  const updateLocationLine = (
    locationIndex: number,
    lineIndex: number,
    updates: Partial<FooterLocationLine>
  ) => {
    const items = [...settings.footerLocations];
    const lines = [...items[locationIndex].lines];
    lines[lineIndex] = { ...lines[lineIndex], ...updates };
    items[locationIndex].lines = lines;
    updateSettings({ footerLocations: items });
  };

  const removeLocationLine = (locationIndex: number, lineIndex: number) => {
    const items = [...settings.footerLocations];
    items[locationIndex].lines = items[locationIndex].lines.filter(
      (_, i) => i !== lineIndex
    );
    updateSettings({ footerLocations: items });
  };

  // Footer Bottom Links handlers
  const addFooterBottomLink = () => {
    updateSettings({
      footerBottomLinks: [...settings.footerBottomLinks, { label: "" }],
    });
  };

  const updateFooterBottomLink = (index: number, updates: Partial<FooterLink>) => {
    const items = [...settings.footerBottomLinks];
    items[index] = { ...items[index], ...updates };
    updateSettings({ footerBottomLinks: items });
  };

  const removeFooterBottomLink = (index: number) => {
    const items = settings.footerBottomLinks.filter((_, i) => i !== index);
    updateSettings({ footerBottomLinks: items });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
            <p className="text-gray-500 text-sm">
              Global Header & Footer configuration
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="branding">
        <TabsList>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Scripts</TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Name</CardTitle>
              <CardDescription>
                The name of your site, displayed in the admin panel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => updateSettings({ siteName: e.target.value })}
                  placeholder="Your Site Name"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
              <CardDescription>
                Your site logo appears in the header and footer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={settings.logoUrl}
                  onChange={(e) => updateSettings({ logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              {settings.logoUrl && (
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Preview:</p>
                  <img
                    src={settings.logoUrl}
                    alt={settings.logoAlt}
                    className="h-16 w-auto object-contain"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="logoAlt">Logo Alt Text</Label>
                <Input
                  id="logoAlt"
                  value={settings.logoAlt}
                  onChange={(e) => updateSettings({ logoAlt: e.target.value })}
                  placeholder="Company Name"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Header CTA Button</CardTitle>
              <CardDescription>
                The call-to-action button in the header
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="headerCtaText">Button Text</Label>
                <Input
                  id="headerCtaText"
                  value={settings.headerCtaText}
                  onChange={(e) =>
                    updateSettings({ headerCtaText: e.target.value })
                  }
                  placeholder="GET HELP NOW"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="headerCtaUrl">Button URL</Label>
                <Input
                  id="headerCtaUrl"
                  value={settings.headerCtaUrl}
                  onChange={(e) =>
                    updateSettings({ headerCtaUrl: e.target.value })
                  }
                  placeholder="#book"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Copyright Text</CardTitle>
              <CardDescription>Displayed in the footer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="copyrightText">Copyright Text</Label>
                <Input
                  id="copyrightText"
                  value={settings.copyrightText}
                  onChange={(e) =>
                    updateSettings({ copyrightText: e.target.value })
                  }
                  placeholder="Copyright © 2026 | Company Name | All Rights Reserved"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Navigation Tab */}
        <TabsContent value="navigation" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Navigation Menu</CardTitle>
              <CardDescription>
                Links displayed in the header navigation bar. Support for dropdown menus (max 2 levels).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.navigationItems.map((item, parentIndex) => (
                <div key={item.id || parentIndex} className="space-y-2">
                  {/* Parent Item */}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex flex-col gap-1 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveNavItem(parentIndex, 'up')}
                        disabled={parentIndex === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveNavItem(parentIndex, 'down')}
                        disabled={parentIndex === settings.navigationItems.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          value={item.label}
                          onChange={(e) =>
                            updateNavItem(parentIndex, undefined, { label: e.target.value })
                          }
                          placeholder="Label"
                        />
                        <Input
                          value={item.href || ""}
                          onChange={(e) =>
                            updateNavItem(parentIndex, undefined, {
                              href: e.target.value || undefined
                            })
                          }
                          placeholder="/page-url (optional for dropdowns)"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.openInNewTab || item.external || false}
                            onCheckedChange={(checked) =>
                              updateNavItem(parentIndex, undefined, {
                                openInNewTab: checked,
                                external: checked
                              })
                            }
                          />
                          <span className="text-sm text-gray-500">Open in new tab</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addChildNavItem(parentIndex)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Child Item
                        </Button>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNavItem(parentIndex, undefined)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Child Items */}
                  {item.children && item.children.length > 0 && (
                    <div className="ml-12 space-y-2 border-l-2 border-gray-300 pl-4">
                      {item.children.map((child, childIndex) => (
                        <div
                          key={child.id || childIndex}
                          className="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded"
                        >
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <Input
                              value={child.label}
                              onChange={(e) =>
                                updateNavItem(parentIndex, childIndex, {
                                  label: e.target.value
                                })
                              }
                              placeholder="Child label"
                              className="text-sm"
                            />
                            <Input
                              value={child.href || ""}
                              onChange={(e) =>
                                updateNavItem(parentIndex, childIndex, {
                                  href: e.target.value || undefined
                                })
                              }
                              placeholder="/page-url"
                              className="text-sm"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNavItem(parentIndex, childIndex)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={addNavItem} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Top-Level Item
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Tab */}
        <TabsContent value="footer" className="mt-6 space-y-6">
          {/* Footer Tagline */}
          <Card>
            <CardHeader>
              <CardTitle>Footer Tagline</CardTitle>
              <CardDescription>
                Main tagline text displayed at the top of the footer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.footerTagline}
                onChange={(e) =>
                  updateSettings({ footerTagline: e.target.value })
                }
                placeholder="Enter footer tagline..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Footer Location Columns */}
          <Card>
            <CardHeader>
              <CardTitle>Footer Location Columns</CardTitle>
              <CardDescription>
                Office locations displayed in the footer grid. Each location has a title and multiple lines.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.footerLocations.map((location, locIndex) => (
                <div key={locIndex} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    <Input
                      value={location.title}
                      onChange={(e) =>
                        updateFooterLocation(locIndex, { title: e.target.value })
                      }
                      placeholder="Location title (e.g., 'Atlanta Office')"
                      className="flex-1 font-semibold"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFooterLocation(locIndex)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="ml-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Lines:</p>
                    {location.lines.map((line, lineIndex) => (
                      <div key={lineIndex} className="flex items-center gap-2">
                        <Input
                          value={line.text}
                          onChange={(e) =>
                            updateLocationLine(locIndex, lineIndex, {
                              text: e.target.value
                            })
                          }
                          placeholder="Line text"
                          className="flex-1 text-sm"
                        />
                        <Input
                          value={line.href || ""}
                          onChange={(e) =>
                            updateLocationLine(locIndex, lineIndex, {
                              href: e.target.value || undefined
                            })
                          }
                          placeholder="Link (optional)"
                          className="flex-1 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLocationLine(locIndex, lineIndex)}
                          className="text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addLocationLine(locIndex)}
                      className="w-full"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Line
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addFooterLocation}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Location Column
              </Button>
            </CardContent>
          </Card>

          {/* Footer Bottom Links */}
          <Card>
            <CardHeader>
              <CardTitle>Footer Bottom Links</CardTitle>
              <CardDescription>
                Links displayed at the bottom of the footer (Privacy Policy, Terms, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.footerBottomLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Input
                    value={link.label}
                    onChange={(e) =>
                      updateFooterBottomLink(index, { label: e.target.value })
                    }
                    placeholder="Link label"
                    className="flex-1"
                  />
                  <Input
                    value={link.href || ""}
                    onChange={(e) =>
                      updateFooterBottomLink(index, {
                        href: e.target.value || undefined
                      })
                    }
                    placeholder="/page-url (optional)"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFooterBottomLink(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addFooterBottomLink}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Bottom Link
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Info Tab */}
        <TabsContent value="contact" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Phone Number</CardTitle>
              <CardDescription>Displayed in header and footer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number (digits only)</Label>
                <Input
                  id="phoneNumber"
                  value={settings.phoneNumber}
                  onChange={(e) =>
                    updateSettings({ phoneNumber: e.target.value })
                  }
                  placeholder="4049057742"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneDisplay">Display Format</Label>
                <Input
                  id="phoneDisplay"
                  value={settings.phoneDisplay}
                  onChange={(e) =>
                    updateSettings({ phoneDisplay: e.target.value })
                  }
                  placeholder="404-905-7742"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneAvailability">Availability Text</Label>
                <Input
                  id="phoneAvailability"
                  value={settings.phoneAvailability}
                  onChange={(e) =>
                    updateSettings({ phoneAvailability: e.target.value })
                  }
                  placeholder="Available 24/7"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={settings.applyPhoneGlobally}
                  onCheckedChange={(checked) =>
                    updateSettings({ applyPhoneGlobally: checked })
                  }
                />
                <Label>Apply this phone number globally across all pages</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
              <CardDescription>
                Physical address displayed in the footer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input
                  id="addressLine1"
                  value={settings.addressLine1}
                  onChange={(e) =>
                    updateSettings({ addressLine1: e.target.value })
                  }
                  placeholder="123 Main Street, Suite 100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  value={settings.addressLine2}
                  onChange={(e) =>
                    updateSettings({ addressLine2: e.target.value })
                  }
                  placeholder="City, State 12345"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>
                Social media icons displayed in the footer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.socialLinks.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <Select
                    value={item.platform}
                    onValueChange={(v) =>
                      updateSocialLink(index, {
                        platform: v as SocialLink["platform"],
                      })
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={item.url}
                    onChange={(e) =>
                      updateSocialLink(index, { url: e.target.value })
                    }
                    placeholder="https://..."
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.enabled}
                      onCheckedChange={(checked) =>
                        updateSocialLink(index, { enabled: checked })
                      }
                    />
                    <span className="text-sm text-gray-500">Show</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSocialLink(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addSocialLink}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Social Link
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Engine Settings
              </CardTitle>
              <CardDescription>
                Control how search engines index your site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Warning:</strong> Enabling site-wide noindex will prevent search engines from indexing any page on your site. This is useful during development or for private sites.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Site-wide No Index</Label>
                  <p className="text-sm text-gray-500">
                    When enabled, all pages will have a noindex meta tag, hiding the entire site from search engines.
                  </p>
                </div>
                <Switch
                  checked={settings.siteNoindex}
                  onCheckedChange={(checked) =>
                    updateSettings({ siteNoindex: checked })
                  }
                />
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Per-Page Indexing</h4>
                <p className="text-sm text-gray-600">
                  Individual pages can also be hidden from search engines using the "No Index" toggle in each page's SEO settings. This allows you to hide specific pages while keeping the rest of your site indexed.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics & Scripts Tab */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Google Analytics
              </CardTitle>
              <CardDescription>
                Track website traffic and user behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ga4MeasurementId">GA4 Measurement ID</Label>
                <Input
                  id="ga4MeasurementId"
                  value={settings.ga4MeasurementId}
                  onChange={(e) =>
                    updateSettings({ ga4MeasurementId: e.target.value })
                  }
                  placeholder="G-XXXXXXXXXX"
                  disabled={!isAdmin && !roleLoading}
                />
                <p className="text-sm text-gray-500">
                  Find this in your Google Analytics 4 property settings
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Google Ads Conversion Tracking
              </CardTitle>
              <CardDescription>
                Track conversions from Google Ads campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="googleAdsId">Google Ads ID</Label>
                <Input
                  id="googleAdsId"
                  value={settings.googleAdsId}
                  onChange={(e) =>
                    updateSettings({ googleAdsId: e.target.value })
                  }
                  placeholder="AW-XXXXXXXXX"
                  disabled={!isAdmin && !roleLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="googleAdsConversionLabel">Conversion Label (optional)</Label>
                <Input
                  id="googleAdsConversionLabel"
                  value={settings.googleAdsConversionLabel}
                  onChange={(e) =>
                    updateSettings({ googleAdsConversionLabel: e.target.value })
                  }
                  placeholder="XXXXXXXXXX"
                  disabled={!isAdmin && !roleLoading}
                />
                <p className="text-sm text-gray-500">
                  Optional: Used for specific conversion actions
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Custom Scripts
              </CardTitle>
              <CardDescription>
                Add custom JavaScript or tracking pixels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isAdmin && !roleLoading && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Admin Only</p>
                    <p className="text-sm text-amber-700">
                      Only administrators can edit custom scripts. Contact an admin if you need to add tracking codes.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="headScripts">Head Scripts</Label>
                <Textarea
                  id="headScripts"
                  value={settings.headScripts}
                  onChange={(e) =>
                    updateSettings({ headScripts: e.target.value })
                  }
                  placeholder="<!-- Scripts to inject before </head> -->"
                  rows={6}
                  className="font-mono text-sm"
                  disabled={!isAdmin && !roleLoading}
                />
                <p className="text-sm text-gray-500">
                  Scripts inserted just before the closing &lt;/head&gt; tag
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerScripts">Footer Scripts</Label>
                <Textarea
                  id="footerScripts"
                  value={settings.footerScripts}
                  onChange={(e) =>
                    updateSettings({ footerScripts: e.target.value })
                  }
                  placeholder="<!-- Scripts to inject before </body> -->"
                  rows={6}
                  className="font-mono text-sm"
                  disabled={!isAdmin && !roleLoading}
                />
                <p className="text-sm text-gray-500">
                  Scripts inserted just before the closing &lt;/body&gt; tag
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
