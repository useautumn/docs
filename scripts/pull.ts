import { parse, stringify } from 'yaml';
import { replaceJavascriptWithTypescript } from './utils/replace-js-with-ts';
import { transformPythonSnippets } from './utils/transform-python-snippets';
import { transformJsSnippets } from './utils/transform-js-snippets';
import { removeSnippets } from './utils/remove-snippets';
import { removeConstraints } from './utils/remove-constraints';
import { removeFieldProperties } from './utils/remove-field-properties';
import { removeInternalFields } from './utils/remove-internal-fields';
import { stripJsDoc } from './utils/strip-jsdoc';


const SCHEMA_FIELD_REMOVALS: Record<string, string[]> = {
  ProductItem: ['feature'],
  Product: ['properties'],
};

const SNIPPET_REMOVALS: Record<string, string[]> = {
  'POST /products/{product_id}': ['TypeScript', 'Python'],
  'GET /products': ['Python'],

  // Missing create, update and delete for features
  'GET /features': ['Python'],
  'GET /features/{feature_id}': ['Python'],
  'POST /features': ['TypeScript', 'Python'],
  'UPDATE /features/{feature_id}': ['TypeScript', 'Python'],
  'DELETE /features/{feature_id}': ['TypeScript', 'Python'],
};

/**
 * Schema constraints to remove
 * Common options: minLength, maxLength, minimum, maximum, pattern, format
 */
const CONSTRAINT_REMOVALS: string[] = [
  'minLength',
];

/**
 * Remove specific properties from fields in endpoints
 * Format: { 'METHOD /path': { 'fieldName': ['property1', 'property2'] } }
 */
const FIELD_PROPERTY_REMOVALS: Record<string, Record<string, string[]>> = {
  'POST /products': {
    'group': ['default'],
  },
};


/**
 * Remove specified fields from schemas in the OpenAPI spec
 */
function removeSchemaFields({ spec, removals }: {
  spec: any;
  removals: Record<string, string[]>;
}) {
  if (!spec.components?.schemas) {
    return;
  }

  for (const [schemaName, fieldsToRemove] of Object.entries(removals)) {
    const schema = spec.components.schemas[schemaName];
    if (!schema?.properties) {
      console.warn(`⚠ Schema "${schemaName}" not found or has no properties`);
      continue;
    }

    for (const field of fieldsToRemove) {
      if (field in schema.properties) {
        delete schema.properties[field];

        // Also remove from required array if present
        if (Array.isArray(schema.required)) {
          schema.required = schema.required.filter((f: string) => f !== field);
          if (schema.required.length === 0) {
            delete schema.required;
          }
        }

        console.log(`  ✓ Removed field "${field}" from schema "${schemaName}"`);
      } else {
        console.warn(`  ⚠ Field "${field}" not found in schema "${schemaName}"`);
      }
    }
  }
}

async function pull() {
  const response = await fetch("https://app.stainless.com/api/spec/documented/autumn/openapi.documented.yml");
  const data = await response.text();

  // Parse the OpenAPI spec
  const spec = parse(data);
  const version = spec.info?.version || 'unknown';

  // Strip JSDoc from descriptions
  console.log('Stripping JSDoc from descriptions...');
  stripJsDoc({ spec });

  // Remove specified fields from schemas
  console.log('Removing fields from schemas...');
  removeSchemaFields({ spec, removals: SCHEMA_FIELD_REMOVALS });

  // Remove schema constraints
  console.log('Removing schema constraints...');
  removeConstraints({ spec, constraints: CONSTRAINT_REMOVALS });

  // Remove field properties (like default values)
  console.log('Removing field properties...');
  removeFieldProperties({ spec, removals: FIELD_PROPERTY_REMOVALS });

  // Remove internal fields
  console.log('Removing internal fields...');
  removeInternalFields({ spec });

  // Replace Javascript with Typescript
  console.log('Replacing Javascript with Typescript...');
  const specWithTypescript = replaceJavascriptWithTypescript({ spec });

  // Transform JavaScript/TypeScript snippets
  console.log('Transforming JavaScript snippets...');
  const specWithJs = transformJsSnippets({ spec: specWithTypescript });

  // Transform Python snippets to async/await
  console.log('Transforming Python snippets...');
  const specWithPython = transformPythonSnippets({ spec: specWithJs });

  // Remove code snippets for specific endpoints (must be after transformations)
  console.log('Removing code snippets from endpoints...');
  const finalSpec = removeSnippets({ spec: specWithPython, removals: SNIPPET_REMOVALS });

  // Write the modified spec
  const filename = `./mintlify/api/openapi-${version}.yml`;
  await Bun.write(filename, stringify(finalSpec));

  console.log(`\n✓ Pulled OpenAPI spec version ${version} to ${filename}`);
}

pull();

