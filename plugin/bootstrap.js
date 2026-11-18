"use strict";

const MENU_ID = "zotero-itemmenu-copy-meta-json";
const MENU_LABEL = "Copy Metadata as JSON";

let registeredMenuID;

function startup({ id }) {
    try {
        registeredMenuID = Zotero.MenuManager?.registerMenu({
            menuID: MENU_ID,
            pluginID: id,
            target: "main/library/item",
            menus: [{
                menuType: "menuitem",
                onShowing(event, { menuElem }) {
                    menuElem.setAttribute("label", MENU_LABEL);
                },
                onCommand(event, { items }) {
                    runCopyTask(items);
                },
            }],
        });
    } catch (error) {
        Zotero.logError(error);
    }

    if (!registeredMenuID) {
        for (const window of Zotero.getMainWindows()) {
            onMainWindowLoad({ window });
        }
    }
}

function onMainWindowLoad({ window }) {
    if (registeredMenuID) return;

    const { document, ZoteroPane } = window;
    const popup = document.getElementById("zotero-itemmenu");
    if (!popup || document.getElementById(MENU_ID)) return;

    const menuItem = document.createXULElement("menuitem");
    menuItem.id = MENU_ID;
    menuItem.setAttribute("label", MENU_LABEL);
    menuItem.addEventListener("command", event => {
        event.stopPropagation();
        runCopyTask(ZoteroPane.getSelectedItems());
    });
    popup.appendChild(menuItem);
}

function shutdown() {
    if (registeredMenuID) {
        Zotero.MenuManager.unregisterMenu(registeredMenuID);
        registeredMenuID = undefined;
        return;
    }

    for (const { document } of Zotero.getMainWindows()) {
        document.getElementById(MENU_ID)?.remove();
    }
}

function getItemJSON(item) {
    let exported;
    try {
        // The default export includes child notes and attachments on Zotero 7–10.
        exported = Zotero.Utilities.Internal.itemToExportFormat(item);
    } catch (error) {
        Zotero.debug("[Copy Metadata] Using item.toJSON(): " + error);
        exported = item.toJSON();
    }

    const cleaned = { ...exported };
    for (const field of Object.keys(cleaned)) {
        if (["itemType", "creators", "tags", "relations", "collections"].includes(field)) continue;
        try {
            const fieldID = Zotero.ItemFields.getID(field);
            if (fieldID && !Zotero.ItemFields.isValidForType(fieldID, item.itemTypeID)) {
                delete cleaned[field];
            }
        } catch {
            // Retain the field if this Zotero version cannot validate it.
        }
    }
    return cleaned;
}

function copyToClipboard(text) {
    try {
        Zotero.Utilities.Internal.copyTextToClipboard(text);
    } catch {
        Components.classes["@mozilla.org/widget/clipboardhelper;1"]
            .getService(Components.interfaces.nsIClipboardHelper)
            .copyString(text);
    }
}

function runCopyTask(items) {
    try {
        if (!items?.length) return;

        const data = items.filter(item => item.isRegularItem()).map(getItemJSON);
        if (!data.length) {
            Zotero.alert(null, "One-Click Copy Metadata", "Select at least one bibliographic item.");
            return;
        }

        copyToClipboard(JSON.stringify(data.length === 1 ? data[0] : data, null, 2));
    } catch (error) {
        Zotero.logError(error);
        Zotero.alert(null, "One-Click Copy Metadata", String(error));
        return;
    }

    if (typeof Zotero.ProgressWindow === "function") {
        const progress = new Zotero.ProgressWindow();
        progress.changeHeadline("Metadata copied as JSON");
        progress.show();
        progress.startCloseTimer(2000);
    }
}
