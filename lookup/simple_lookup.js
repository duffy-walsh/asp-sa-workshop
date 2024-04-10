// remmeber to enable change stream sources
// https://github.com/josephxsxn/atlas_stream_processors
//
// drop some dummy documents in the two collections we will use
// so we can run a for loop over all collections in our demo db
// and enable them
db.people.insertOne({name : "Ryan", company : "MongoDB"})
db.data.insertOne({name : "Duffy" })
var cols = db.getCollectionNames()
for (const el of cols){
    db.runCommand( {
        collMod: el,
        changeStreamPreAndPostImages: { enabled: true }
    } )
}

// use collection 'asp_examples'
use asp_examples

// data to be lookedup
db.people.insertOne({name : "Joe", company : "MongoDB"})


s = {
  $source:  {
      connectionName: 'aspDemoConnection',
      db: 'asp_examples',
      coll: 'data',
      config : {
            fullDocument: 'required',
            fullDocumentOnly : true,
          },        
  }
}

l = {
  $lookup: {
      from: {
          connectionName: 'aspDemoConnection',
          db: 'asp_examples',
          coll: 'people'
      },
      localField: "name",
      foreignField: "name",
      as: 'enrichment',
  }
}

sp.createStreamProcessor('asp_simple_lookup', [s,l, {
    $merge: { 
        into: {
            connectionName: 'aspDemoConnection', 
            db: 'asp_examples', 
            coll: 'matched'
        } 
    }
}])

sp.asp_simple_lookup.start()


//document for stream processor
db.data.insertOne({name : "Joe"})


--Merge to a Atlas Cluster Collection
merge = {
    $merge: {
        into: {
            connectionName: 'aspDemoConnection',
            db: 'asp_examples',
            coll: 'matched'
        },
        on: ['name'],
        whenMatched: 'merge',
        whenNotMatched: 'insert'
    }
}
