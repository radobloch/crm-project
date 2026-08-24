import { useState, useMemo } from 'react';
import {
  INITIAL_COLLECTIONS,
  INITIAL_RECORDS,
  INITIAL_WORKFLOWS,
  INITIAL_ROLES,
} from './data/initialData';
import { Collection, RecordItem, ViewType, Workflow, RolePermission, CollectionField } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TableView } from './components/TableView';
import { KanbanView } from './components/KanbanView';
import { CalendarView } from './components/CalendarView';
import { DashboardView } from './components/DashboardView';
import { FormModal } from './components/FormModal';
import { RecordDetailModal } from './components/RecordDetailModal';
import { SchemaBuilderModal } from './components/SchemaBuilderModal';
import { WorkflowBuilder } from './components/WorkflowBuilder';
import { ApiExplorer } from './components/ApiExplorer';
import { RolePermissionManager } from './components/RolePermissionManager';
import { ImportExportModal } from './components/ImportExportModal';
import { AboutNocoBaseModal } from './components/AboutNocoBaseModal';

export default function App() {
  // Collections & Records State
  const [collections, setCollections] = useState<Collection[]>(INITIAL_COLLECTIONS);
  const [recordsMap, setRecordsMap] = useState<Record<string, RecordItem[]>>(INITIAL_RECORDS);
  const [workflows, setWorkflows] = useState<Workflow[]>(INITIAL_WORKFLOWS);
  const [roles, setRoles] = useState<RolePermission[]>(INITIAL_ROLES);

  // Navigation State
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(INITIAL_COLLECTIONS[0]?.id || 'deals');
  const [activeTab, setActiveTab] = useState<string>('collection');
  const [viewType, setViewType] = useState<ViewType>('table');
  const [designMode, setDesignMode] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentRole, setCurrentRole] = useState<string>('admin');

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<RecordItem | null>(null);
  const [defaultFormValues, setDefaultFormValues] = useState<Partial<RecordItem> | undefined>(undefined);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [recordToView, setRecordToView] = useState<RecordItem | null>(null);

  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Current Collection & Records
  const currentCollection = useMemo(() => {
    return collections.find((c) => c.id === selectedCollectionId) || collections[0];
  }, [collections, selectedCollectionId]);

  const currentRecords = useMemo(() => {
    if (!currentCollection) return [];
    return recordsMap[currentCollection.id] || [];
  }, [recordsMap, currentCollection]);

  // Current Role Permissions
  const rolePermissions = useMemo(() => {
    const roleObj = roles.find((r) => r.roleId === currentRole);
    if (!roleObj || currentRole === 'admin') {
      return { create: true, read: true, update: true, delete: true, export: true };
    }
    return (
      roleObj.permissions[currentCollection?.id] || {
        create: false,
        read: true,
        update: false,
        delete: false,
        export: false,
      }
    );
  }, [roles, currentRole, currentCollection]);

  // Record CRUD Handlers
  const handleSaveRecord = (formData: Partial<RecordItem>) => {
    if (!currentCollection) return;

    if (recordToEdit) {
      // Update existing
      setRecordsMap((prev) => {
        const list = prev[currentCollection.id] || [];
        const updatedList = list.map((item) =>
          item.id === recordToEdit.id
            ? { ...item, ...formData, updatedAt: new Date().toISOString() }
            : item
        );
        return { ...prev, [currentCollection.id]: updatedList };
      });
    } else {
      // Create new
      const newRecord: RecordItem = {
        id: `rec_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...formData,
      };
      setRecordsMap((prev) => {
        const list = prev[currentCollection.id] || [];
        return { ...prev, [currentCollection.id]: [newRecord, ...list] };
      });
    }
  };

  const handleDeleteRecord = (id: string) => {
    if (!currentCollection) return;
    setRecordsMap((prev) => {
      const list = prev[currentCollection.id] || [];
      return {
        ...prev,
        [currentCollection.id]: list.filter((r) => r.id !== id),
      };
    });
  };

  const handleUpdateRecordField = (recordId: string, fieldName: string, value: any) => {
    if (!currentCollection) return;
    setRecordsMap((prev) => {
      const list = prev[currentCollection.id] || [];
      const updatedList = list.map((item) =>
        item.id === recordId
          ? { ...item, [fieldName]: value, updatedAt: new Date().toISOString() }
          : item
      );
      return { ...prev, [currentCollection.id]: updatedList };
    });
  };

  // Collection Schema Handlers
  const handleAddCollection = (newCol: Collection) => {
    setCollections((prev) => [...prev, newCol]);
    setRecordsMap((prev) => ({ ...prev, [newCol.id]: [] }));
    setSelectedCollectionId(newCol.id);
  };

  const handleUpdateCollectionFields = (collectionId: string, fields: CollectionField[]) => {
    setCollections((prev) =>
      prev.map((col) => (col.id === collectionId ? { ...col, fields } : col))
    );
  };

  const handleDeleteCollection = (collectionId: string) => {
    setCollections((prev) => prev.filter((col) => col.id !== collectionId));
    setRecordsMap((prev) => {
      const copy = { ...prev };
      delete copy[collectionId];
      return copy;
    });
  };

  // Workflow Handlers
  const handleToggleWorkflow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  };

  const handleAddWorkflow = (wf: Workflow) => {
    setWorkflows((prev) => [...prev, wf]);
  };

  // Role Permissions Handlers
  const handleUpdateRolePermission = (
    roleId: string,
    collectionId: string,
    action: 'create' | 'read' | 'update' | 'delete' | 'export',
    value: boolean
  ) => {
    setRoles((prev) =>
      prev.map((role) => {
        if (role.roleId !== roleId) return role;
        const currentPerms = role.permissions[collectionId] || {
          create: false,
          read: true,
          update: false,
          delete: false,
          export: false,
        };
        return {
          ...role,
          permissions: {
            ...role.permissions,
            [collectionId]: {
              ...currentPerms,
              [action]: value,
            },
          },
        };
      })
    );
  };

  // Bulk Import
  const handleImportRecords = (collectionId: string, newRecords: RecordItem[]) => {
    setRecordsMap((prev) => ({
      ...prev,
      [collectionId]: [...newRecords, ...(prev[collectionId] || [])],
    }));
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#09090b] font-sans antialiased text-[#fafafa] overflow-hidden">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCollection={currentCollection}
        designMode={designMode}
        setDesignMode={setDesignMode}
        onNewRecord={() => {
          setRecordToEdit(null);
          setDefaultFormValues(undefined);
          setIsFormModalOpen(true);
        }}
        onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
        onOpenApiModal={() => setActiveTab('api')}
        onOpenAboutModal={() => setIsAboutModalOpen(true)}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
      />

      {/* Main Workspace Layout (Sidebar + Center Content) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          onSelectCollection={(id) => {
            setSelectedCollectionId(id);
            setSearchTerm('');
          }}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          viewType={viewType}
          setViewType={setViewType}
          onOpenCreateCollection={() => setIsSchemaModalOpen(true)}
          onOpenImportExport={() => setIsImportExportOpen(true)}
          onOpenAboutModal={() => setIsAboutModalOpen(true)}
        />

        {/* Center Workspace Stage */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'collection' && currentCollection ? (
            viewType === 'table' ? (
              <TableView
                collection={currentCollection}
                records={currentRecords}
                designMode={designMode}
                onEditRecord={(rec) => {
                  setRecordToEdit(rec);
                  setIsFormModalOpen(true);
                }}
                onDeleteRecord={handleDeleteRecord}
                onViewRecord={(rec) => {
                  setRecordToView(rec);
                  setIsDetailModalOpen(true);
                }}
                onUpdateRecordField={handleUpdateRecordField}
                onOpenAddField={() => setIsSchemaModalOpen(true)}
                canEdit={rolePermissions.update}
                canDelete={rolePermissions.delete}
                searchTerm={searchTerm}
              />
            ) : viewType === 'kanban' ? (
              <KanbanView
                collection={currentCollection}
                records={currentRecords}
                designMode={designMode}
                onEditRecord={(rec) => {
                  setRecordToEdit(rec);
                  setIsFormModalOpen(true);
                }}
                onDeleteRecord={handleDeleteRecord}
                onViewRecord={(rec) => {
                  setRecordToView(rec);
                  setIsDetailModalOpen(true);
                }}
                onUpdateRecordField={handleUpdateRecordField}
                onNewRecordWithDefaults={(defaults) => {
                  setRecordToEdit(null);
                  setDefaultFormValues(defaults);
                  setIsFormModalOpen(true);
                }}
                canEdit={rolePermissions.update}
              />
            ) : viewType === 'calendar' ? (
              <CalendarView
                collection={currentCollection}
                records={currentRecords}
                onViewRecord={(rec) => {
                  setRecordToView(rec);
                  setIsDetailModalOpen(true);
                }}
                onNewRecordWithDefaults={(defaults) => {
                  setRecordToEdit(null);
                  setDefaultFormValues(defaults);
                  setIsFormModalOpen(true);
                }}
              />
            ) : (
              <DashboardView
                collection={currentCollection}
                records={currentRecords}
                onViewRecord={(rec) => {
                  setRecordToView(rec);
                  setIsDetailModalOpen(true);
                }}
              />
            )
          ) : activeTab === 'workflows' ? (
            <WorkflowBuilder
              workflows={workflows}
              collections={collections}
              onToggleWorkflow={handleToggleWorkflow}
              onAddWorkflow={handleAddWorkflow}
            />
          ) : activeTab === 'roles' ? (
            <RolePermissionManager
              roles={roles}
              collections={collections}
              onUpdateRolePermission={handleUpdateRolePermission}
            />
          ) : activeTab === 'api' ? (
            <ApiExplorer
              collections={collections}
              recordsMap={recordsMap}
            />
          ) : null}
        </main>
      </div>

      {/* Form Modal (Create / Edit Record) */}
      {currentCollection && (
        <FormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setRecordToEdit(null);
            setDefaultFormValues(undefined);
          }}
          collection={currentCollection}
          recordToEdit={recordToEdit}
          onSave={handleSaveRecord}
          defaultValues={defaultFormValues}
        />
      )}

      {/* Record Detail Modal */}
      {currentCollection && (
        <RecordDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setRecordToView(null);
          }}
          collection={currentCollection}
          record={recordToView}
          onEdit={(rec) => {
            setRecordToEdit(rec);
            setIsFormModalOpen(true);
          }}
          canEdit={rolePermissions.update}
        />
      )}

      {/* Schema & Collection Builder Modal */}
      <SchemaBuilderModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        collections={collections}
        onAddCollection={handleAddCollection}
        onUpdateCollectionFields={handleUpdateCollectionFields}
        onDeleteCollection={handleDeleteCollection}
      />

      {/* Import / Export Modal */}
      {currentCollection && (
        <ImportExportModal
          isOpen={isImportExportOpen}
          onClose={() => setIsImportExportOpen(false)}
          collection={currentCollection}
          records={currentRecords}
          onImportRecords={handleImportRecords}
        />
      )}

      {/* About NocoBase & GitHub Deployment Modal */}
      <AboutNocoBaseModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  );
}
