//! Accessibility API helpers for working with UI elements

use cidre::ax;
use cidre::arc::R;

/// Get a string attribute from a UI element
pub fn get_string_attr(element: &ax::UiElement, attr: &ax::Attr) -> Option<String> {
    element
        .attr_value(attr)
        .ok()
        .and_then(|v| {
            if v.get_type_id() == cidre::cf::String::type_id() {
                let cf_str: &cidre::cf::String = unsafe { std::mem::transmute(&*v) };
                Some(cf_str.to_string())
            } else {
                None
            }
        })
}

/// Extract a clean role name from an AX role
pub fn extract_role_name(role: &R<ax::Role>) -> String {
    let debug = format!("{:?}", role);
    if let Some(start) = debug.find("AX") {
        let rest = &debug[start..];
        let end = rest.find(|c| c == ')' || c == '"' || c == '}').unwrap_or(rest.len());
        return rest[..end].to_string();
    }
    "Unknown".to_string()
}

/// Get the value attribute of an element
pub fn get_value(element: &ax::UiElement) -> Option<String> {
    get_string_attr(element, ax::attr::value())
}

/// Get the title attribute of an element
pub fn get_title(element: &ax::UiElement) -> Option<String> {
    get_string_attr(element, ax::attr::title())
}

/// Get the description attribute of an element
pub fn get_description(element: &ax::UiElement) -> Option<String> {
    get_string_attr(element, ax::attr::desc())
}

/// Get the role of an element as a string
pub fn get_role(element: &ax::UiElement) -> Option<String> {
    element.role().ok().map(|r| extract_role_name(&r))
}

/// Get the role description of an element
pub fn get_role_desc(element: &ax::UiElement) -> Option<String> {
    element.role_desc().ok().map(|s| s.to_string())
}

/// Get all children of an element
pub fn get_children(element: &ax::UiElement) -> Vec<R<ax::UiElement>> {
    element
        .children()
        .ok()
        .map(|children| children.iter().map(|c| c.retained()).collect())
        .unwrap_or_default()
}

/// Find elements matching a predicate by traversing the tree
pub fn find_elements<F>(root: &ax::UiElement, predicate: F, max_depth: usize) -> Vec<R<ax::UiElement>>
where
    F: Fn(&ax::UiElement) -> bool + Copy,
{
    let mut results = Vec::new();
    find_elements_recursive(root, predicate, max_depth, 0, &mut results);
    results
}

fn find_elements_recursive<F>(
    element: &ax::UiElement,
    predicate: F,
    max_depth: usize,
    current_depth: usize,
    results: &mut Vec<R<ax::UiElement>>,
) where
    F: Fn(&ax::UiElement) -> bool + Copy,
{
    if current_depth > max_depth {
        return;
    }

    if predicate(element) {
        results.push(element.retained());
    }

    for child in get_children(element) {
        find_elements_recursive(&child, predicate, max_depth, current_depth + 1, results);
    }
}

/// Find elements by role
pub fn find_by_role(root: &ax::UiElement, role: &str, max_depth: usize) -> Vec<R<ax::UiElement>> {
    find_elements(root, |e| get_role(e).as_deref() == Some(role), max_depth)
}

/// Find elements containing specific text
pub fn find_by_text(root: &ax::UiElement, text: &str, max_depth: usize) -> Vec<R<ax::UiElement>> {
    let text_lower = text.to_lowercase();
    find_elements(
        root,
        |e| {
            get_value(e)
                .or_else(|| get_title(e))
                .or_else(|| get_description(e))
                .map(|t| t.to_lowercase().contains(&text_lower))
                .unwrap_or(false)
        },
        max_depth,
    )
}
