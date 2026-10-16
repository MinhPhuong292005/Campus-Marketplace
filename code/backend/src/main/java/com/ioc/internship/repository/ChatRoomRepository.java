package com.ioc.internship.repository;

import com.ioc.internship.entity.ChatRoomEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoomEntity, Long> {

    @Query("SELECT r FROM ChatRoomEntity r " +
           "WHERE (r.userOne.id = :u1 AND r.userTwo.id = :u2) " +
           "   OR (r.userOne.id = :u2 AND r.userTwo.id = :u1)")
    List<ChatRoomEntity> findBetweenUsers(@Param("u1") Long u1, @Param("u2") Long u2);

    @Query("SELECT r FROM ChatRoomEntity r " +
           "WHERE (r.userOne.id = :userId OR r.userTwo.id = :userId) " +
           "ORDER BY r.updatedAt DESC")
    List<ChatRoomEntity> findAllUserRooms(@Param("userId") Long userId);

    @Query("SELECT r FROM ChatRoomEntity r " +
           "WHERE r.listing.id = :listingId " +
           "  AND ((r.userOne.id = :u1 AND r.userTwo.id = :u2) OR (r.userOne.id = :u2 AND r.userTwo.id = :u1))")
    Optional<ChatRoomEntity> findByListingAndUsers(
            @Param("listingId") Long listingId,
            @Param("u1") Long u1,
            @Param("u2") Long u2
    );
}
