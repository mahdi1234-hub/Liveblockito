import { useOthers, useSelf } from "@liveblocks/react/suspense";
import { UserButton } from "@clerk/nextjs";
import styles from "./Avatars.module.css";

export function Avatars() {
  const users = useOthers();
  const currentUser = useSelf();

  return (
    <div className={styles.avatars}>
      {users.map(({ connectionId, info }) => {
        return (
          <Avatar key={connectionId} picture={info.avatar} name={info.name} />
        );
      })}

      {currentUser && (
        <div className="relative ml-8 first:ml-0" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Avatar
            picture={currentUser.info.avatar}
            name={currentUser.info.name}
          />
          <UserButton />
        </div>
      )}
    </div>
  );
}

export function Avatar({ picture, name }: { picture: string; name: string }) {
  return (
    <div className={styles.avatar} data-tooltip={name}>
      <img
        alt={name}
        src={picture}
        className={styles.avatar_picture}
        data-tooltip={name}
      />
    </div>
  );
}
