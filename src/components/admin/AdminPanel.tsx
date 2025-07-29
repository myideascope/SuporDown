import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  getAllUsers,
  getAllGroups,
  addUserToGroup,
  removeUserFromGroup,
  getAlerts,
  updateAlertStatus,
  getAlertDispatchers,
  updateAlertDispatcherStatus,
} from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Shield, Bell, Settings } from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name: string;
  user_groups: { groups: { id: string; name: string } }[];
}

interface Group {
  id: string;
  name: string;
  description: string;
}

interface Alert {
  id: string;
  name: string;
  service_id: string;
  enabled: boolean;
}

interface AlertDispatcher {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
}

const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dispatchers, setDispatchers] = useState<AlertDispatcher[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const { hasPermission } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersResult, groupsResult, alertsResult, dispatchersResult] =
        await Promise.all([
          getAllUsers(),
          getAllGroups(),
          getAlerts(),
          getAlertDispatchers(),
        ]);

      if (usersResult.data) setUsers(usersResult.data);
      if (groupsResult.data) setGroups(groupsResult.data);
      if (alertsResult.data) setAlerts(alertsResult.data);
      if (dispatchersResult.data) setDispatchers(dispatchersResult.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUserToGroup = async () => {
    if (!selectedUser || !selectedGroup) return;

    const { error } = await addUserToGroup(selectedUser, selectedGroup);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "User added to group successfully",
      });
      loadData();
    }
  };

  const handleRemoveUserFromGroup = async (userId: string, groupId: string) => {
    const { error } = await removeUserFromGroup(userId, groupId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "User removed from group successfully",
      });
      loadData();
    }
  };

  const handleToggleAlert = async (alertId: string, enabled: boolean) => {
    const { error } = await updateAlertStatus(alertId, enabled);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Alert ${enabled ? "enabled" : "disabled"} successfully`,
      });
      loadData();
    }
  };

  const handleToggleDispatcher = async (
    dispatcherId: string,
    enabled: boolean,
  ) => {
    const { error } = await updateAlertDispatcherStatus(dispatcherId, enabled);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Dispatcher ${enabled ? "enabled" : "disabled"} successfully`,
      });
      loadData();
    }
  };

  if (!hasPermission("admin")) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Access Denied</h3>
              <p className="text-muted-foreground">
                You don't have permission to access the admin panel.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-background p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage users, groups, and permissions
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Users & Groups
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="mr-2 h-4 w-4" />
            Alert Management
          </TabsTrigger>
          <TabsTrigger value="dispatchers">
            <Settings className="mr-2 h-4 w-4" />
            Alert Dispatchers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Add User to Group</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select User</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Select Group</Label>
                  <Select
                    value={selectedGroup}
                    onValueChange={setSelectedGroup}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddUserToGroup} className="w-full">
                  Add to Group
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Users Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div>
                        <p className="font-medium">
                          {user.full_name || user.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {user.user_groups?.map((ug) => (
                            <Badge
                              key={ug.groups.id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {ug.groups.name}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-1 h-4 w-4 p-0"
                                onClick={() =>
                                  handleRemoveUserFromGroup(
                                    user.id,
                                    ug.groups.id,
                                  )
                                }
                              >
                                ×
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div>
                      <p className="font-medium">{alert.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Service: {alert.service_id}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`alert-${alert.id}`}>Enabled</Label>
                      <Switch
                        id={`alert-${alert.id}`}
                        checked={alert.enabled}
                        onCheckedChange={(enabled) =>
                          handleToggleAlert(alert.id, enabled)
                        }
                        disabled={!hasPermission("enable_disable_alerts")}
                      />
                    </div>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No alerts configured yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dispatchers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Dispatchers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dispatchers.map((dispatcher) => (
                  <div
                    key={dispatcher.id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div>
                      <p className="font-medium">{dispatcher.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Type: {dispatcher.type}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`dispatcher-${dispatcher.id}`}>
                        Enabled
                      </Label>
                      <Switch
                        id={`dispatcher-${dispatcher.id}`}
                        checked={dispatcher.enabled}
                        onCheckedChange={(enabled) =>
                          handleToggleDispatcher(dispatcher.id, enabled)
                        }
                        disabled={!hasPermission("manage_alert_dispatchers")}
                      />
                    </div>
                  </div>
                ))}
                {dispatchers.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No alert dispatchers configured yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
