/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.apache.nifi.registry.db.entity;

import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import java.util.Date;
import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;

@Entity
@Table(name = "BUCKET")
public class BucketEntity {

    @Id
    private String id;

    private String name;

    private String description;

    private Date created;

    @OneToMany(
            mappedBy = "bucket",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private Set<BucketItemEntity> items;


    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Date getCreated() {
        return created;
    }

    public void setCreated(Date created) {
        this.created = created;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Set<BucketItemEntity> getItems() {
        return items;
    }

    public void setItems(Set<BucketItemEntity> items) {
        this.items = items;
    }

    /**
     * Convenience method to obtain all FlowEntity objects from the items set.
     *
     * @return a set of FlowEntities
     */
    public Set<FlowEntity> getFlows() {
        final Set<FlowEntity> flows = new LinkedHashSet<>();
        for (final BucketItemEntity itemEntity : getItems()) {
            if (BucketItemEntityType.FLOW == itemEntity.getType()) {
                flows.add((FlowEntity) itemEntity);
            }
        }
        return flows;
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(this.id);
    }

    @Override
    public boolean equals(final Object obj) {
        if (obj == null) {
            return false;
        }
        if (getClass() != obj.getClass()) {
            return false;
        }

        final BucketEntity other = (BucketEntity) obj;
        return Objects.equals(this.id, other.id);
    }

}