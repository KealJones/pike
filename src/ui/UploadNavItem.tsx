import { Upload } from "@mui/icons-material";
import { ListItem, IconButton, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { useDialogs, type NavigationPageItem } from "@toolpad/core";
import { UploadStorageDialog } from "./UploadStorageDialog";

export function UploadNavItem({
  item,
  mini,
}: {
  item: NavigationPageItem;
  mini: boolean;
}) {
  const dialogManager = useDialogs();
  return (
    <ListItem
      onClick={() => dialogManager.open(UploadStorageDialog)}
      sx={(theme) => ({
        color: theme.palette.secondary.main,
        overflowX: 'hidden',
      })}
    >
      {mini ? (
        <IconButton
          aria-label="upload storage"
          sx={(theme) => ({
            color: theme.palette.secondary.main,
          })}
        >
          <Upload />
        </IconButton>
      ) : (
        <ListItemButton>
          <ListItemIcon
            sx={(theme) => ({
              color: theme.palette.secondary.main,
            })}
          >
            <Upload />
          </ListItemIcon>
          <ListItemText
            primary={item.title}
            sx={{
              whiteSpace: 'nowrap',
            }}
          />
        </ListItemButton>
      )}
    </ListItem>
  );
}
