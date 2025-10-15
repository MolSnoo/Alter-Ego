use isolang::Language;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// #[derive(Serialize, Deserialize, Debug, Clone)]
// pub struct StringTableEntry {
//     pub id: String,
//     pub value: HashMap<Language, String>,
// }

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StringTable {
    #[serde(flatten)]
    pub map: HashMap<String, HashMap<Language, String>>,
}

impl StringTable {
    /// Creates a new StringTable from a HashMap.
    #[allow(dead_code)]
    pub fn new(map: &HashMap<String, HashMap<Language, String>>) -> Self {
        Self { map: map.clone() }
    }
}

impl StringTable {
    /// Returns a localized string for the given id and language.
    pub fn get(&self, id: &str, language: &Language) -> Option<String> {
        let entry = self.map.get(id);
        match entry {
            Some(entry) => match entry.get(language) {
                None => entry.get(&Language::from_639_1("en").unwrap()).cloned(),
                Some(value) => Some(value.clone()),
            },
            None => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::str::FromStr;

    #[test]
    fn test_stringtable_from_json() {
        let test_json = json!({
            "string1": {
                "en": "hello",
                "fr": "bonjour"
            },
            "string2": {
                "en": "world",
                "fr": "monde"
            },
            "string3": {}
        });

        let stringtable: StringTable = serde_json::from_value(test_json).unwrap();

        assert_eq!(
            stringtable.get("string1", &Language::from_str("en").unwrap()),
            Some("hello".to_string())
        );
        assert_eq!(
            stringtable.get("string1", &Language::from_str("fr").unwrap()),
            Some("bonjour".to_string())
        );
        assert_eq!(
            stringtable.get("string1", &Language::from_str("de").unwrap()),
            Some("hello".to_string())
        );
        assert_eq!(
            stringtable.get("string3", &Language::from_str("de").unwrap()),
            None
        );
    }

    #[test]
    fn test_stringtable_get() {
        let mut map: HashMap<String, HashMap<Language, String>> = HashMap::new();
        let mut value1: HashMap<Language, String> = HashMap::new();

        value1.insert(Language::from_str("en").unwrap(), "hello".to_string());
        value1.insert(Language::from_str("fr").unwrap(), "bonjour".to_string());
        map.insert("string1".to_string(), value1);
        map.insert("string2".to_string(), HashMap::new());

        let stringtable = StringTable::new(&map);

        assert_eq!(
            stringtable.get("string1", &Language::from_str("en").unwrap()),
            Some("hello".to_string())
        );
        assert_eq!(
            stringtable.get("string1", &Language::from_str("fr").unwrap()),
            Some("bonjour".to_string())
        );
        assert_eq!(
            stringtable.get("string2", &Language::from_str("en").unwrap()),
            None
        );
        assert_eq!(
            stringtable.get("string1", &Language::from_str("de").unwrap()),
            Some("hello".to_string())
        );
    }
}
