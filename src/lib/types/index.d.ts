// Adapter types
export type {
	Adapter,
	AdapterBlocksInterface,
	AdapterCollectionInterface,
	AdapterGlobalInterface,
	AdapterRelationsInterface,
	AdapterTransformInterface,
	GenericAdapterInterfaceArgs,
	TransformContext,
	TransformManyContext
} from './adapter.js';

// API types
export type {
	LocalAPI,
	LocalAPICollectionInterface,
	LocalAPIConstructorArgs,
	LocalAPIGlobalInterface,
	OperationQuery
} from './api.js';

// Auth types
export type { Access, User } from './auth';

// Config types
export type {
	BaseCollectionConfig,
	BrowserConfig,
	BuiltCollectionConfig,
	BuiltConfig,
	BuiltDocConfig,
	BuiltGlobalConfig,
	BuiltUploadCollectionConfig,
	CollectionConfig,
	Config,
	CustomPanelRoute,
	DocConfig,
	DocumentPrototype,
	GlobalConfig,
	ImageSizesConfig,
	LocaleConfig,
	LocalizationConfig,
	PanelUsersConfig,
	RouteConfig,
	// SMTPConfig,
	UploadCollectionConfig
} from './config.js';

// Doc types
export type {
	BaseDoc,
	CollectionSlug,
	DocPrototype,
	GenericBlock,
	GenericDoc,
	PrototypeSlug,
	UploadDoc
} from './doc.js';

// Fields types
export type {
	AnyField,
	AnyFormField,
	FieldsType,
	FormField,
	Option,
	UserDefinedField
} from './fields.js';

// Hooks types
export type {
	CollectionHook,
	CollectionHookAfterDelete,
	CollectionHookArgs,
	CollectionHookBeforeDelete,
	CollectionHookBeforeRead,
	CollectionHookBeforeReadArgs,
	CollectionHooks,
	GlobalHookBeforeRead,
	GlobalHookBeforeReadArgs,
	GlobalHookBeforeUpdate,
	GlobalHookBeforeUpdateArgs,
	GlobalHooks
} from './hooks.js';

// Panel types
export type { CollectionLayoutProps, FieldPanelTableConfig, FormErrors, Route } from './panel.js';

// Upload types
export type { JsonFile } from './upload.js';
