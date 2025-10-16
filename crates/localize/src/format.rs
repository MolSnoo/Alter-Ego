use regex::Regex;

/// Formats a string with arguments.
pub fn format(string: &str, args: &[String]) -> String {
    // Get array of unique placeholders in string.
    let re_placeholders = Regex::new(r"\{([1-9]\d*)}").unwrap();
    let mut placeholders = re_placeholders
        .captures_iter(string)
        .filter_map(|cap| cap.get(1).map(|m| m.as_str().parse::<usize>().unwrap()))
        .collect::<Vec<usize>>();
    placeholders.dedup();

    // Make a new mutable string
    let mut formatted = string.to_string();

    // Replace placeholders with args.
    for placeholder in placeholders {
        let re = Regex::new(&format!(r"\{{{n}}}", n = placeholder)).unwrap();

        // Make sure the placeholder is within the bounds of the args array.
        if placeholder <= args.len() {
            formatted = re
                .replace_all(&formatted, &args[placeholder - 1])
                .to_string();
        } else {
            continue;
        }
    }

    formatted
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_single() {
        let preformat = "Hello {1}!";
        let args = ["Amy".to_string()];
        let res = format(preformat, &args);

        assert_eq!(res, "Hello Amy!");
    }

    #[test]
    fn test_format_multiple() {
        let preformat = "{1} puts {2} in {3} pockets and ties {3} shoelaces together.";
        let args = ["Amy".to_string(), "the keys".to_string(), "her".to_string()];
        let res = format(preformat, &args);

        assert_eq!(
            res,
            "Amy puts the keys in her pockets and ties her shoelaces together."
        );
    }

    #[test]
    fn test_format_missing_arg() {
        let preformat = "{1} puts {2} in {3} pockets and ties {3} shoelaces together.";
        let args = ["Amy".to_string(), "the keys".to_string()];
        let res = format(preformat, &args);

        assert_eq!(
            res,
            "Amy puts the keys in {3} pockets and ties {3} shoelaces together."
        );
    }

    #[test]
    fn test_format_extra_args() {
        let preformat = "{1} puts {2} in {3} pockets and ties {3} shoelaces together.";
        let args = [
            "Amy".to_string(),
            "the keys".to_string(),
            "her".to_string(),
            "lorem".to_string(),
            "ipsum".to_string(),
        ];
        let res = format(preformat, &args);

        assert_eq!(
            res,
            "Amy puts the keys in her pockets and ties her shoelaces together."
        );
    }

    #[test]
    fn test_format_extra_args_fr() {
        let preformat = "{1} met {2} dans sa poche et attache ses sachets.";
        let args = ["Amy".to_string(), "les clés".to_string(), "".to_string()];
        let res = format(preformat, &args);

        assert_eq!(
            res,
            "Amy met les clés dans sa poche et attache ses sachets."
        )
    }

    #[test]
    fn test_format_invalid_placeholder() {
        let preformat = "{1} puts {2} in {3} pockets and ties {0} {abcd} shoelaces together.";
        let args = ["Amy".to_string(), "the keys".to_string(), "her".to_string()];
        let res = format(preformat, &args);

        assert_eq!(
            res,
            "Amy puts the keys in her pockets and ties {0} {abcd} shoelaces together."
        );
    }
}
