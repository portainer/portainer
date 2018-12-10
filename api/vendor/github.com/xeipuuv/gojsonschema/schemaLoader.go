package gojsonschema

import (
	"github.com/xeipuuv/gojsonreference"
)

type SchemaLoader struct {
	pool *schemaPool
}

func NewSchemaLoader() *SchemaLoader {

	ps := &SchemaLoader{
		pool: &schemaPool{
			schemaPoolDocuments: make(map[string]*schemaPoolDocument),
		},
	}

	return ps
}

// AddSchemas adds an arbritrary amount of schemas to the schema cache. As this function does not require
// an explicit URL, every schema should contain an $id, so that it can be referenced by the main schema
func (sl *SchemaLoader) AddSchemas(loaders ...JSONLoader) error {
	emptyRef, _ := gojsonreference.NewJsonReference("")

	for _, loader := range loaders {
		doc, err := loader.LoadJSON()
		if err != nil {
			return err
		}
		// Directly use the Recursive function, so that it get only added to the schema pool by $id
		// and not by the ref of the document as it's empty
		if err = sl.pool.parseReferencesRecursive(doc, emptyRef); err != nil {
			return err
		}
	}

	return nil
}

//AddSchema adds a schema under the provided URL to the schema cache
func (sl *SchemaLoader) AddSchema(url string, loader JSONLoader) error {

	ref, err := gojsonreference.NewJsonReference(url)

	if err != nil {
		return err
	}

	doc, err := loader.LoadJSON()

	if err != nil {
		return err
	}

	return sl.pool.ParseReferences(doc, ref)
}

func (sl *SchemaLoader) Compile(rootSchema JSONLoader) (*Schema, error) {

	ref, err := rootSchema.JsonReference()

	if err != nil {
		return nil, err
	}

	d := Schema{}
	d.pool = sl.pool
	d.pool.jsonLoaderFactory = rootSchema.LoaderFactory()
	d.documentReference = ref
	d.referencePool = newSchemaReferencePool()

	var doc interface{}
	if ref.String() != "" {
		// Get document from schema pool
		spd, err := d.pool.GetDocument(d.documentReference)
		if err != nil {
			return nil, err
		}
		doc = spd.Document
	} else {
		// Load JSON directly
		doc, err = rootSchema.LoadJSON()
		if err != nil {
			return nil, err
		}
		// References need only be parsed if loading JSON directly
		//  as pool.GetDocument already does this for us if loading by reference
		err = d.pool.ParseReferences(doc, ref)
		if err != nil {
			return nil, err
		}
	}

	err = d.parse(doc)
	if err != nil {
		return nil, err
	}

	return &d, nil
}
